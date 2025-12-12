public interface IExerciseRepository
{
    Task<IReadOnlyList<Exercise>> GetAllAsync(
        MuscleGroup? muscleGroup,
        Equipment? equipment,
        Difficulty? difficulty,
        CancellationToken ct = default);

    Task<Exercise?> GetByIdAsync(Guid id, CancellationToken ct = default);
}