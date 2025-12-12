
public record ExerciseResponse(
    Guid Id,
    string Name,
    string? Description,
    MuscleGroup MuscleGroup,
    Equipment Equipment,
    Difficulty Difficulty
);