public interface IExerciseRepository
{
    Task<IReadOnlyList<Exercise>> GetAllAsync(
        MuscleGroup? muscleGroup,
        Equipment? equipment,
        Difficulty? difficulty,
        CancellationToken ct = default);
}