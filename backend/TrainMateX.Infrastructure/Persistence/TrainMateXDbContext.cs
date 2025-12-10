using Microsoft.EntityFrameworkCore;
using TrainMateX.Domain.Entities;

namespace TrainMateX.Infrastructure.Persistence;

public class TrainMateXDbContext : DbContext
{
    public TrainMateXDbContext(DbContextOptions<TrainMateXDbContext> options) : base(options)
    { }

    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<UserProfile>()
            .HasIndex(u => u.ClerkUserId)
            .IsUnique();
    }
}