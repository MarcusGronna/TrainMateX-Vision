public interface IWorkoutRepository
{
    Task<IReadOnlyList<Workout>> GetByProgramIdAsync(Guid trainingProgramId, CancellationToken ct = default);

    Task<Workout?> GetByIdWithProgramAsync(Guid id, CancellationToken ct = default);

    Task<Workout?> GetByIdAsync(Guid id, CancellationToken ct = default);

    Task AddAsync(Workout workout, CancellationToken ct = default);

    void Remove(Workout workout);

    Task SaveChangesAsync(CancellationToken ct = default);
}