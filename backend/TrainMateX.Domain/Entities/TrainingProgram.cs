using TrainMateX.Domain.Entities;

public class TrainingProgram
{
    public Guid Id { get; set; }
    public Guid UserProfileId { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string? Level { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public UserProfile UserProfile { get; set; } = null!;
}