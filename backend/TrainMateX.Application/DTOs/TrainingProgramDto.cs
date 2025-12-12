public record TrainingProgramDto(
    Guid Id,
    string Name,
    string? Description,
    string? Level,
    DateTime CreatedAt
);

public record CreateTrainingProgramRequest(
    string Name,
    string? Description,
    string? Level
);

public record UpdateTrainingProgramRequest(
    string Name,
    string? Description,
    string? Level
);