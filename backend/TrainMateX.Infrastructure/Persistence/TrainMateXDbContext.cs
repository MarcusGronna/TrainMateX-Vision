using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
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

        modelBuilder.Entity<WorkoutExercise>(we =>
        {
            we.HasKey(x => x.Id);

            we.HasOne(x => x.Workout)
                .WithMany(w => w.WorkoutExercises)
                .HasForeignKey(x => x.WorkoutId)
                .OnDelete(DeleteBehavior.Cascade);

            we.HasOne(x => x.Exercise)
                .WithMany(e => e.WorkoutExercises)
                .HasForeignKey(x => x.ExerciseId)
                .OnDelete(DeleteBehavior.Restrict);

            we.Property(x => x.Sets).IsRequired();
            we.Property(x => x.Reps).IsRequired();
        });

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

        modelBuilder.Entity<Exercise>()
            .Property(e => e.MuscleGroup)
            .HasConversion(
                new EnumToStringConverter<MuscleGroup>());

        modelBuilder.Entity<Exercise>()
            .Property(e => e.Equipment)
            .HasConversion(new EnumToStringConverter<Equipment>());

        modelBuilder.Entity<Exercise>()
            .Property(e => e.Difficulty)
            .HasConversion(new EnumToStringConverter<Difficulty>());

        modelBuilder.Entity<Exercise>()
            .Property(e => e.Category)
            .HasConversion(new EnumToStringConverter<Category>());
    }
}