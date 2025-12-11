public interface ITrainingProgramRepository
{
    Task<List<TrainingProgram>> GetAllForUserAsync(
        Guid userProfileId,
        CancellationToken ct = default
    );

    Task<TrainingProgram?> GetByIdAsync(
        Guid id,
        Guid userProfileId,
        CancellationToken ct = default
    );

    Task AddAsync(
        TrainingProgram program,
        CancellationToken ct = default
    );

    Task SaveChangesAsync(CancellationToken ct = default);
}