public record WorkoutResponse(
    Guid Id,
    Guid TrainingProgramId,
    string Name,
    string? DayOfWeek,
    string? Notes,
    DateTime CreatedAt);

public record CreateWorkoutRequest(
    string Name,
    string? DayOfWeek,
    string? Notes);

public record UpdateWorkoutRequest(
    string Name,
    string? DayOfWeek,
    string? Notes);