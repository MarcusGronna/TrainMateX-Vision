public interface IWorkoutExerciseRepository
{
    Task<IReadOnlyList<WorkoutExercise>> GetByWorkoutIdAsync(
        Guid workoutId,
        CancellationToken ct = default);

    Task<WorkoutExercise?> GetByIdAsync(
        Guid id,
        CancellationToken ct = default);

    Task AddAsync(WorkoutExercise workoutExercise, CancellationToken ct = default);
    Task RemoveAsync(WorkoutExercise workoutExercise, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}