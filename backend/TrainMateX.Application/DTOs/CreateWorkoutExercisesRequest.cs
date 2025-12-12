public record CreateWorkoutExerciseRequest(
    Guid ExerciseId,
    int Sets,
    int Reps,
    int? Weight,
    string? Notes
);