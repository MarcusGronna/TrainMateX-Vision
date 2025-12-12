
using Microsoft.EntityFrameworkCore;
using TrainMateX.Infrastructure.Persistence;

public class TrainingProgramRepository : ITrainingProgramRepository
{
    private readonly TrainMateXDbContext _dbContext;

    public TrainingProgramRepository(TrainMateXDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(TrainingProgram program, CancellationToken ct = default)
    {
        await _dbContext.TrainingPrograms.AddAsync(program, ct);
    }

    public Task<List<TrainingProgram>> GetAllForUserAsync(Guid userProfileId, CancellationToken ct = default)
    {
        return _dbContext.TrainingPrograms
            .Where(p => p.UserProfileId == userProfileId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(ct);
    }

    public Task<TrainingProgram?> GetByIdAsync(Guid id, Guid userProfileId, CancellationToken ct = default)
    {
        return _dbContext.TrainingPrograms
            .FirstOrDefaultAsync(
                p => p.Id == id && p.UserProfileId == userProfileId,
                ct
            );
    }

    public void Remove(TrainingProgram program)
    {
        _dbContext.TrainingPrograms.Remove(program);
    }

    public Task SaveChangesAsync(CancellationToken ct = default)
    {
        return _dbContext.SaveChangesAsync(ct);
    }
}