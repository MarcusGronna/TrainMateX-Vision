
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
        MuscleGroup? muscleGroup,
        Equipment? equipment,
        Difficulty? difficulty,
        CancellationToken ct = default)
    {
        IQueryable<Exercise> query = _dbContext.Exercises;

        if (muscleGroup is MuscleGroup mg)
        {
            query = query.Where(e => e.MuscleGroup == mg);
        }

        if (equipment is Equipment eq)
        {
            query = query.Where(e => e.Equipment == eq);
        }

        if (difficulty is Difficulty d)
        {
            query = query.Where(e => e.Difficulty == d);
        }

        return await query.ToListAsync(ct);
    }
}