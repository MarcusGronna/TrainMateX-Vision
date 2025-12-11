public class WorkoutService
{
    private readonly IWorkoutRepository _workoutRepository;
    private readonly ITrainingProgramRepository _trainingProgramRepository;

    public WorkoutService(
        IWorkoutRepository workoutRepository,
        ITrainingProgramRepository trainingProgramRepository)
    {
        _workoutRepository = workoutRepository;
        _trainingProgramRepository = trainingProgramRepository;
    }

    public async Task<IReadOnlyList<Workout>> GetForProgramAsync(
        Guid trainingProgramId,
        Guid userProfileId,
        CancellationToken ct = default)
    {
        var program = await _trainingProgramRepository.GetByIdAsync(trainingProgramId, userProfileId, ct);

        if (program is null)
        {
            throw new InvalidOperationException("Training program not found");
        }

        return await _workoutRepository.GetByProgramIdAsync(trainingProgramId, ct);
    }

    public async Task<Workout> CreateForProgramAsync(
        Guid trainingProgramId,
        Guid userProfileId,
        string name,
        string? dayOfWeek,
        string? notes,
        CancellationToken ct = default)
    {
        var program = await _trainingProgramRepository.GetByIdAsync(trainingProgramId, userProfileId, ct);

        if (program is null)
        {
            throw new InvalidOperationException("Training program not found");
        }

        var workout = new Workout
        {
            Id = Guid.NewGuid(),
            TrainingProgramId = trainingProgramId,
            Name = name,
            DayOfWeek = dayOfWeek,
            Notes = notes,
            CreatedAt = DateTime.UtcNow
        };

        await _workoutRepository.AddAsync(workout, ct);
        await _workoutRepository.SaveChangesAsync(ct);

        return workout;
    }
}