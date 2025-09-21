using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Api.Data;

public class DesignTimeFactory : IDesignTimeDbContextFactory<AppDb>
{
    public AppDb CreateDbContext(string[] args)
    {
        var cs = Environment.GetEnvironmentVariable("DB_CONN")
                 ?? "Server=localhost,1433;Database=premiums;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True";
        var opts = new DbContextOptionsBuilder<AppDb>().UseSqlServer(cs).Options;
        return new AppDb(opts);
    }
}
