public record UpdateWorkoutExerciseRequest(
    int Sets,
    int Reps,
    int? Weight,
    string? Notes
);
