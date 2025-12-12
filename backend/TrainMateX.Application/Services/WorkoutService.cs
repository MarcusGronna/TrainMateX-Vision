public class WorkoutService
{
    private readonly IWorkoutRepository _workoutRepository;
    private readonly IExerciseRepository _exerciseRepository;
    private readonly IWorkoutExerciseRepository _workoutExerciseRepository;
    private readonly ITrainingProgramRepository _trainingProgramRepository;

    public WorkoutService(
        IWorkoutRepository workoutRepository,
        IExerciseRepository exerciseRepository,
        IWorkoutExerciseRepository workoutExerciseRepository,
        ITrainingProgramRepository trainingProgramRepository)
    {
        _workoutRepository = workoutRepository;
        _exerciseRepository = exerciseRepository;
        _workoutExerciseRepository = workoutExerciseRepository;
        _trainingProgramRepository = trainingProgramRepository;
    }

    public async Task<IReadOnlyList<WorkoutExercise>> GetExercisesForWorkoutAsync(
        Guid workoutId,
        Guid userProfileId,
        CancellationToken ct = default)
    {
        var workout = await _workoutRepository.GetByIdWithProgramAsync(workoutId, ct);

        if (workout is null || workout.TrainingProgram.UserProfileId != userProfileId)
        {
            throw new InvalidOperationException("Workout not found for this user");
        }

        return await _workoutExerciseRepository.GetByWorkoutIdAsync(workoutId, ct);
    }

    public async Task<WorkoutExercise> AddExerciseToWorkoutAsync(
        Guid workoutId,
        Guid userProfileId,
        Guid exerciseId,
        int sets,
        int reps,
        int? weight,
        string? notes,
        CancellationToken ct = default)
    {
        var workout = await _workoutRepository.GetByIdWithProgramAsync(workoutId, ct);

        if (workout is null || workout.TrainingProgram.UserProfileId != userProfileId)
        {
            throw new InvalidOperationException("Workout not found for this user");
        }

        var exercise = await _exerciseRepository.GetByIdAsync(exerciseId, ct);
        if (exercise is null)
        {
            throw new InvalidOperationException("Exercise not found");
        }

        var workoutExercise = new WorkoutExercise
        {
            Id = Guid.NewGuid(),
            WorkoutId = workoutId,
            ExerciseId = exerciseId,
            Sets = sets,
            Reps = reps,
            Weight = weight,
            Notes = notes,
            CreatedAt = DateTime.UtcNow
        };

        await _workoutExerciseRepository.AddAsync(workoutExercise, ct);
        await _workoutExerciseRepository.SaveChangesAsync(ct);

        return workoutExercise;
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