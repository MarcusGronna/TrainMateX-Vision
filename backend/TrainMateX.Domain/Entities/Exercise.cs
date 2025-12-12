public class Exercise
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public Category Category { get; set; }
    public MuscleGroup MuscleGroup { get; set; }
    public Equipment Equipment { get; set; }
    public Difficulty Difficulty { get; set; }

    public ICollection<WorkoutExercise> WorkoutExercises { get; set; } = new List<WorkoutExercise>();
}