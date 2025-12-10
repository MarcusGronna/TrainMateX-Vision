using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TrainMateX.Infrastructure.Persistence;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<TrainMateXDbContext>(options =>
        {
            options.UseSqlServer(
                config.GetConnectionString("DefaultConnection"));
        });

        // will add repository registrations here

        return services;
    }
}