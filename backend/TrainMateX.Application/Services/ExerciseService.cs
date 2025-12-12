public class ExerciseService
{
    private readonly IExerciseRepository _repository;

    public ExerciseService(IExerciseRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<Exercise>> GetAllAsync(
        MuscleGroup? muscleGroup,
        Equipment? equipment,
        Difficulty? difficulty,
        CancellationToken ct = default
    )
    {
        return await _repository.GetAllAsync(
            muscleGroup,
            equipment,
            difficulty,
            ct);
    }
}