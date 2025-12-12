public interface IWorkoutExerciseRepository
{
    Task AddAsync(WorkoutExercise workoutExercise, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}