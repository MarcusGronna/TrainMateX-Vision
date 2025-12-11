public class Workout
{
    public Guid Id { get; set; }

    // FK to TrainingProgram
    public Guid TrainingProgramId { get; set; }
    public string Name { get; set; } = null!;
    public string? DayOfWeek { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }

    //Navigation
    public TrainingProgram TrainingProgram { get; set; } = null!;
}