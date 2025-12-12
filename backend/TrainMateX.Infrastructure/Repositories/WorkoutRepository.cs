using Microsoft.EntityFrameworkCore;
using TrainMateX.Infrastructure.Persistence;

public class WorkoutRepository : IWorkoutRepository
{
    private readonly TrainMateXDbContext _dbContext;

    public WorkoutRepository(TrainMateXDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(Workout workout, CancellationToken ct = default)
    {
        await _dbContext.Workouts.AddAsync(workout, ct);
    }

    public async Task<Workout?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _dbContext.Workouts
               .FirstOrDefaultAsync(w => w.Id == id, ct);
    }

    public async Task<Workout?> GetByIdWithProgramAsync(Guid id, CancellationToken ct = default)
    {
        return await _dbContext.Workouts
            .Include(w => w.TrainingProgram)
            .FirstOrDefaultAsync(w => w.Id == id, ct);
    }

    public async Task<IReadOnlyList<Workout>> GetByProgramIdAsync(Guid trainingProgramId, CancellationToken ct = default)
    {
        return await _dbContext.Workouts
            .Where(w => w.TrainingProgramId == trainingProgramId)
            .OrderBy(w => w.DayOfWeek)
            .ThenBy(w => w.CreatedAt)
            .ToListAsync(ct);
    }

    public Task SaveChangesAsync(CancellationToken ct = default)
    {
        return _dbContext.SaveChangesAsync(ct);
    }
}