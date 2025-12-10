using Microsoft.EntityFrameworkCore;
using TrainMateX.Domain.Entities;

namespace TrainMateX.Infrastructure.Persistence;

public class TrainMateXDbContext : DbContext
{
    public TrainMateXDbContext(DbContextOptions<TrainMateXDbContext> options) : base(options)
    { }

    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<TrainingProgram> TrainingPrograms => Set<TrainingProgram>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<UserProfile>()
            .HasIndex(u => u.ClerkUserId)
            .IsUnique();

        modelBuilder.Entity<TrainingProgram>()
            .HasOne(tp => tp.UserProfile)
            .WithMany(u => u.TrainingPrograms)
            .HasForeignKey(tp => tp.UserProfileId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}