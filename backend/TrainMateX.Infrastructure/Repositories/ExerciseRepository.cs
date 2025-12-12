
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

        if (!string.IsNullOrWhiteSpace(muscleGroup) &&
            Enum.TryParse<MuscleGroup>(muscleGroup, ignoreCase: true, out var parsedMuscleGroup))
        {
            query = query.Where(e => e.MuscleGroup == parsedMuscleGroup);
        }

        if (!string.IsNullOrWhiteSpace(equipment) &&
            Enum.TryParse<Equipment>(equipment, ignoreCase: true, out var parsedEquipment))
        {
            query = query.Where(e => e.Equipment == parsedEquipment);
        }

        if (!string.IsNullOrWhiteSpace(difficulty) &&
                Enum.TryParse<Difficulty>(difficulty, ignoreCase: true, out var parsedDifficulty))
        {
            query = query.Where(e => e.Difficulty == parsedDifficulty);
        }

        return await query.ToListAsync(ct);
    }
}