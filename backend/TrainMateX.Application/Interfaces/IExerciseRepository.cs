public interface IExerciseRepository
{
    Task<IReadOnlyList<Exercise>> GetAllAsync(
        string? muscleGroup,
        string? equipment,
        string? difficulty,
        CancellationToken ct = default);
}