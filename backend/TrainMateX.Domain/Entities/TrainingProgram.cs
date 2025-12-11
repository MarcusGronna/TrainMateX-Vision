using TrainMateX.Domain.Entities;

public class TrainingProgram
{
    public Guid Id { get; set; }

    // FK
    public Guid UserProfileId { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string? Level { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public UserProfile UserProfile { get; set; } = null!;
    public ICollection<Workout> Workouts { get; set; } = new List<Workout>();
}