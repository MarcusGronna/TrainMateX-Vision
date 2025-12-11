using Microsoft.EntityFrameworkCore;
using TrainMateX.Domain.Entities;

namespace TrainMateX.Infrastructure.Persistence;

public class TrainMateXDbContext : DbContext
{
    public TrainMateXDbContext(DbContextOptions<TrainMateXDbContext> options) : base(options)
    { }

    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<TrainingProgram> TrainingPrograms => Set<TrainingProgram>();
    public DbSet<Workout> Workouts => Set<Workout>();

    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<WorkoutExercise> WorkoutExercises => Set<WorkoutExercise>();


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

        modelBuilder.Entity<WorkoutExercise>()
            .HasOne(we => we.Workout)
            .WithMany(w => w.WorkoutExercises)
            .HasForeignKey(we => we.WorkoutId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WorkoutExercise>()
            .HasOne(we => we.Exercise)
            .WithMany(e => e.WorkoutExercises)
            .HasForeignKey(we => we.ExerciseId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<WorkoutExercise>()
            .HasIndex(we => new { we.WorkoutId, we.ExerciseId })
            .IsUnique();

        modelBuilder.Entity<Workout>(entity =>
        {
            entity.ToTable("Workouts");

            entity.HasKey(w => w.Id);

            entity.Property(w => w.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(w => w.DayOfWeek)
                .HasMaxLength(20);

            entity.Property(w => w.CreatedAt)
                 .HasDefaultValueSql("GETUTCDATE()");

            entity.HasOne(w => w.TrainingProgram)
                .WithMany(p => p.Workouts)
                .HasForeignKey(w => w.TrainingProgramId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}