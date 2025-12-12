public class WorkoutExercise
{
    public Guid Id { get; set; }

    public Guid WorkoutId { get; set; }
    public Workout Workout { get; set; } = null!;

    public Guid ExerciseId { get; set; }
    public Exercise Exercise { get; set; } = null!;

    public int Sets { get; set; }
    public int Reps { get; set; }
    public int? Weight { get; set; }

    public string? Notes { get; set; }
}