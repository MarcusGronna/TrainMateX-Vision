
using Microsoft.EntityFrameworkCore;
using TrainMateX.Infrastructure.Persistence;

public class ExerciseRepository : IExerciseRepository
{
    private readonly TrainMateXDbContext _dbContext;

    public ExerciseRepository(TrainMateXDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<Exercise>> GetAllAsync(
        string? muscleGroup,
        string? equipment,
        string? difficulty,
        CancellationToken ct = default)
    {
        IQueryable<Exercise> query = _dbContext.Exercises;

        if (!string.IsNullOrWhiteSpace(muscleGroup))
        {
            query = query.Where(e => e.MuscleGroup == muscleGroup);
        }

        if (!string.Is)
    }
}