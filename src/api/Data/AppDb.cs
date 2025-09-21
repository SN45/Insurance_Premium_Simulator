using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Shared;

namespace Api.Data;

// NOTE: ApplicationUser is defined in ApplicationUser.cs
public class AppDb : IdentityDbContext<ApplicationUser>
{
    public AppDb(DbContextOptions<AppDb> options) : base(options) {}

    // Domain tables (from Shared project)
    public DbSet<Policy> Policies => Set<Policy>();
    public DbSet<LifestyleMetric> LifestyleMetrics => Set<LifestyleMetric>();
    public DbSet<RiskWeight> RiskWeights => Set<RiskWeight>();
    public DbSet<PremiumQuote> PremiumQuotes => Set<PremiumQuote>();
    public DbSet<Reward> Rewards => Set<Reward>();
    public DbSet<AuditLedger> AuditLedgers => Set<AuditLedger>();

    // Legacy/domain customer table (Guid key, not Identity)
    public DbSet<Shared.User> UsersLegacy => Set<Shared.User>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        // Minimal mappings for Shared entities if needed
        b.Entity<Policy>().HasKey(x => x.Id);
        b.Entity<Policy>().HasOne<Shared.User>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        b.Entity<LifestyleMetric>().HasKey(x => x.Id);
        b.Entity<LifestyleMetric>().HasOne<Shared.User>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        b.Entity<RiskWeight>().HasKey(x => x.Id);
        b.Entity<PremiumQuote>().HasKey(x => x.Id);
        b.Entity<Reward>().HasKey(x => x.Id);
        b.Entity<AuditLedger>().HasKey(x => x.Id);

        b.Entity<Shared.User>().HasKey(x => x.Id);
    }
}
