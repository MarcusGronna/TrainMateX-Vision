
using Microsoft.EntityFrameworkCore;
using TrainMateX.Infrastructure.Persistence;

public class WorkoutExerciseRepository : IWorkoutExerciseRepository
{
    private readonly TrainMateXDbContext _dbContext;

    public WorkoutExerciseRepository(TrainMateXDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(WorkoutExercise workoutExercise, CancellationToken ct = default)
    {
        await _dbContext.WorkoutExercises.AddAsync(workoutExercise, ct);
    }

    public async Task<WorkoutExercise?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _dbContext.WorkoutExercises
            .Include(we => we.Exercise)
            .FirstOrDefaultAsync(we => we.Id == id, ct);
    }

    public async Task<IReadOnlyList<WorkoutExercise>> GetByWorkoutIdAsync(Guid workoutId, CancellationToken ct = default)
    {
        return await _dbContext.WorkoutExercises
            .Include(we => we.Exercise)
            .Where(we => we.WorkoutId == workoutId)
            .OrderBy(we => we.CreatedAt)
            .ToListAsync(ct);
    }

    public Task RemoveAsync(WorkoutExercise workoutExercise, CancellationToken ct = default)
    {
        _dbContext.WorkoutExercises.Remove(workoutExercise);

        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken ct = default)
    {
        return _dbContext.SaveChangesAsync(ct);
    }
}