public record WorkoutExerciseResponse(
    Guid Id,
    Guid WorkoutId,
    Guid ExerciseId,
    string ExerciseName,
    int Sets,
    int Reps,
    int? Weight,
    string? Notes,
    DateTime CreatedAt
);