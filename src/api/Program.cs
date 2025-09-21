using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

using Api.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Shared;
using Stripe;

var builder = WebApplication.CreateBuilder(args);

// ---------------- DB ----------------
var cs = builder.Configuration.GetConnectionString("Default")
         ?? Environment.GetEnvironmentVariable("DB_CONN")
         ?? "Server=localhost,1433;Database=premiums;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True";
builder.Services.AddDbContext<AppDb>(o => o.UseSqlServer(cs));

// ---------------- CORS (Vite dev) ----------------
var origins = new[] {
    "http://localhost:5173","http://localhost:5174",
    "http://127.0.0.1:5173","http://127.0.0.1:5174"
};
builder.Services.AddCors(o => o.AddDefaultPolicy(
    p => p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()
));

// ---------------- Swagger ----------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ============== AUTH & JWT ==============
builder.Services
    .AddIdentityCore<ApplicationUser>(o =>
    {
        o.Password.RequiredLength = 6;
        o.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<AppDb>()
    .AddSignInManager();

var jwtSigningKey = builder.Configuration["JWT_SIGNING_KEY"] ?? "dev-signing-key-change-me";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = "premium-simulator",
            ValidAudience = "premium-simulator",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSigningKey)),
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true
        };
    });
builder.Services.AddAuthorization();

// ============== STRIPE ==============
StripeConfiguration.ApiKey = builder.Configuration["STRIPE_SECRET"] ?? "";

// ---------------- Build ----------------
var app = builder.Build();

app.UseCors();
app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthentication();
app.UseAuthorization();

// ---------------- Health ----------------
app.MapGet("/health", () => Results.Ok("ok"));

// =======================================================
// ================ AUTH ENDPOINTS =======================
// =======================================================
app.MapPost("/auth/register", async (RegisterDto dto, UserManager<ApplicationUser> users) =>
{
    var user = new ApplicationUser
    {
        UserName = dto.Email,
        Email = dto.Email,
        PhoneNumber = dto.PhoneNumber,
        FullName = dto.FullName
    };
    var res = await users.CreateAsync(user, dto.Password);
    return res.Succeeded
        ? Results.Ok(new { ok = true })
        : Results.BadRequest(res.Errors.Select(e => e.Description));
});

app.MapPost("/auth/login", async (LoginDto dto, UserManager<ApplicationUser> users) =>
{
    var user = await users.FindByEmailAsync(dto.Email);
    if (user is null) return Results.BadRequest("Invalid credentials.");
    if (!await users.CheckPasswordAsync(user, dto.Password)) return Results.BadRequest("Invalid credentials.");

    var claims = new List<Claim>
    {
        new(JwtRegisteredClaimNames.Sub, user.Id),
        new(JwtRegisteredClaimNames.Email, user.Email ?? ""),
        new("name", user.FullName ?? "")
    };

    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSigningKey));
    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    var token = new JwtSecurityToken(
        issuer: "premium-simulator",
        audience: "premium-simulator",
        claims: claims,
        expires: DateTime.UtcNow.AddDays(1),
        signingCredentials: creds
    );
    var jwt = new JwtSecurityTokenHandler().WriteToken(token);

    return Results.Ok(new { token = jwt, user = new { id = user.Id, email = user.Email, fullName = user.FullName } });
});

app.MapPost("/auth/forgot", (LoginDto dto) => Results.Ok(new { ok = true }));

app.MapGet("/auth/me", async (HttpContext ctx, UserManager<ApplicationUser> users) =>
{
    if (!ctx.User.Identity?.IsAuthenticated ?? true) return Results.Unauthorized();
    var userId = ctx.User.FindFirstValue(JwtRegisteredClaimNames.Sub);
    var u = await users.FindByIdAsync(userId!);
    return Results.Ok(new { id = u!.Id, email = u.Email, fullName = u.FullName });
}).RequireAuthorization();

// =======================================================
// ============== PAYMENTS (STRIPE) ======================
// =======================================================
app.MapPost("/billing/create-intent", async (CreateIntentDto dto, IConfiguration cfg) =>
{
    var service = new PaymentIntentService();
    var pi = await service.CreateAsync(new PaymentIntentCreateOptions
    {
        Amount = dto.Amount,
        Currency = "usd",
        AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions { Enabled = true }
    });
    var publishable = cfg["STRIPE_PUBLISHABLE"] ?? "";
    return Results.Ok(new { clientSecret = pi.ClientSecret, publishableKey = publishable });
});

// =======================================================
// ============== ADMIN SEED ENDPOINTS ===================
// =======================================================
app.MapPost("/admin/seed-weights", async (AppDb db) =>
{
    if (await db.RiskWeights.AnyAsync()) return Results.Ok("already seeded");
    db.RiskWeights.AddRange(new[]
    {
        new RiskWeight{ Metric="Steps",       Weight=0.20, Direction="HigherIsBetter", CapMin=2000, CapMax=12000 },
        new RiskWeight{ Metric="RestingHR",   Weight=0.15, Direction="LowerIsBetter",  CapMin=50,   CapMax=90 },
        new RiskWeight{ Metric="BMI",         Weight=0.15, Direction="LowerIsBetter",  CapMin=18.5, CapMax=32 },
        new RiskWeight{ Metric="SleepHours",  Weight=0.10, Direction="HigherIsBetter", CapMin=5,    CapMax=8 },
        new RiskWeight{ Metric="DrivingScore",Weight=0.30, Direction="HigherIsBetter", CapMin=50,   CapMax=100 },
        new RiskWeight{ Metric="MilesDriven", Weight=0.10, Direction="LowerIsBetter",  CapMin=0,    CapMax=1500 },
    });
    await db.SaveChangesAsync();
    return Results.Ok("seeded");
});

// IMPORTANT: seed BOTH the DOMAIN (Guid) user and an IDENTITY user (string id)
app.MapPost("/admin/seed-demo", async (AppDb db, UserManager<ApplicationUser> userManager) =>
{
    // Domain (Guid) user id used by Policies/Metrics (Shared.User)
    var uid = Guid.Parse("00000000-0000-0000-0000-000000000001");

    // 1) Ensure DOMAIN customer exists (Shared.User has Guid key)
    var customers = db.Set<Shared.User>();
    if (!await customers.AnyAsync(u => u.Id == uid))
    {
        customers.Add(new Shared.User { Id = uid, Email = "demo@example.com", Name = "Demo User" });

        var pid = Guid.NewGuid();
        db.Policies.Add(new Policy { Id = pid, UserId = uid, BasePremium = 120m, CoverageType = "auto", Status = "active" });

        db.LifestyleMetrics.Add(new LifestyleMetric {
            Id = Guid.NewGuid(), UserId = uid, Date = DateOnly.FromDateTime(DateTime.UtcNow.Date),
            Steps = 6000, RestingHR = 68, BMI = 26, SleepHours = 7, DrivingScore = 82, MilesDriven = 450
        });

        await db.SaveChangesAsync();
    }

    // 2) Ensure IDENTITY user exists (string key) for login
    var identityEmail = "demo@example.com";
    var identity = await userManager.FindByEmailAsync(identityEmail);
    if (identity == null)
    {
        var appUser = new ApplicationUser
        {
            UserName = identityEmail,
            Email = identityEmail,
            FullName = "Demo User"
        };
        var create = await userManager.CreateAsync(appUser, "Demo@123"); // demo password
        if (!create.Succeeded) return Results.BadRequest(create.Errors.Select(e => e.Description));
    }

    return Results.Ok("demo ready");
});

// =======================================================
// ============== PREMIUM & METRICS API ==================
// =======================================================

// Current premium from saved metrics
app.MapGet("/premium/preview", async (Guid userId, AppDb db) =>
{
    var policy = await db.Policies.FirstOrDefaultAsync(p => p.UserId == userId);
    if (policy is null) return Results.NotFound("No policy for user");

    var weights = await db.RiskWeights.ToListAsync();
    var latest = await db.LifestyleMetrics
        .Where(m => m.UserId == userId)
        .OrderByDescending(m => m.Date)
        .FirstOrDefaultAsync();

    var metrics = new Dictionary<string,double> {
        ["Steps"]        = latest?.Steps        ?? 5000,
        ["RestingHR"]    = latest?.RestingHR    ?? 70,
        ["BMI"]          = latest?.BMI          ?? 26,
        ["SleepHours"]   = latest?.SleepHours   ?? 7,
        ["DrivingScore"] = latest?.DrivingScore ?? 80,
        ["MilesDriven"]  = latest?.MilesDriven  ?? 500,
    };

    var result = RiskEngine.Compute(policy.BasePremium, metrics, weights);
    return Results.Ok(result);
});

// What-if premium from client-sent values
app.MapPost("/premium/whatif", async (WhatIfRequest req, AppDb db) =>
{
    var policy = await db.Policies.FirstOrDefaultAsync(p => p.UserId == req.UserId);
    if (policy is null) return Results.NotFound("No policy for user");

    var weights = await db.RiskWeights.ToListAsync();
    var metrics = new Dictionary<string,double> {
        ["Steps"]        = req.Steps,
        ["RestingHR"]    = req.RestingHR,
        ["BMI"]          = req.BMI,
        ["SleepHours"]   = req.SleepHours,
        ["DrivingScore"] = req.DrivingScore,
        ["MilesDriven"]  = req.MilesDriven,
    };

    var result = RiskEngine.Compute(policy.BasePremium, metrics, weights);
    return Results.Ok(result);
});

// Latest metrics for syncing sliders
app.MapGet("/metrics/latest", async (Guid userId, AppDb db) =>
{
    var latest = await db.LifestyleMetrics
        .Where(m => m.UserId == userId)
        .OrderByDescending(m => m.Date)
        .FirstOrDefaultAsync();

    var dto = new MetricsDto(
        Steps:        latest?.Steps        ?? 6000,
        RestingHR:    latest?.RestingHR    ?? 68,
        BMI:          latest?.BMI          ?? 26,
        SleepHours:   latest?.SleepHours   ?? 7,
        DrivingScore: latest?.DrivingScore ?? 82,
        MilesDriven:  latest?.MilesDriven  ?? 450
    );
    return Results.Ok(dto);
});

app.Run();

// ================== Records / DTOs ==================
public record CreateIntentDto(long Amount);

public record RegisterDto(string FullName, string Email, string PhoneNumber, string Password);
public record LoginDto(string Email, string Password);

public record WhatIfRequest(
    Guid UserId,
    double Steps,
    double RestingHR,
    double BMI,
    double SleepHours,
    double DrivingScore,
    double MilesDriven);

public record MetricsDto(
    int Steps,
    int RestingHR,
    double BMI,
    double SleepHours,
    int DrivingScore,
    int MilesDriven);
