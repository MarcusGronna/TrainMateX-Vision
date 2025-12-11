public interface IWorkoutRepository
{
    Task<IReadOnlyList<Workout>> GetByProgramIdAsync(
        Guid trainingProgramId,
        CancellationToken ct = default
    );

    Task<Workout> GetByIdAsync(
        Guid id,
        CancellationToken ct = default);

    Task AddAsync(
        Workout workout,
        CancellationToken ct = default);

    Task SaveChangesAsync(CancellationToken ct = default);
}