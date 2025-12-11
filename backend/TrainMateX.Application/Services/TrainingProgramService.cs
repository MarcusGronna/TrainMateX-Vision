using System.ComponentModel;
using System.Security.Cryptography.X509Certificates;

public class TrainingProgramService
{
    private readonly ITrainingProgramRepository _repository;

    public TrainingProgramService(ITrainingProgramRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<TrainingProgramDto>> GetAllForUserAsync(
        Guid userProfileId,
        CancellationToken ct = default
    )
    {
        var programs = await _repository.GetAllForUserAsync(userProfileId, ct);

        return programs
            .Select(p => new TrainingProgramDto(
                p.Id,
                p.Name,
                p.Description,
                p.Level,
                p.CreatedAt
            ))
            .ToList();
    }

    public async Task<TrainingProgramDto?> GetByIdForUserAsync(
        Guid id,
        Guid userProfileId,
        CancellationToken ct = default
    )
    {
        var program = await _repository.GetByIdAsync(id, userProfileId, ct);

        if (program is null)
        {
            return null;
        }

        return new TrainingProgramDto(
            program.Id,
            program.Name,
            program.Description,
            program.Level,
            program.CreatedAt
        );

    }
    public async Task<TrainingProgramDto> CreateAsync(
        Guid userProfileId,
        CreateTrainingProgramRequest request,
        CancellationToken ct = default
    )
    {
        var program = new TrainingProgram
        {
            Id = Guid.NewGuid(),
            UserProfileId = userProfileId,
            Name = request.Name,
            Description = request.Description,
            Level = request.Level,
            CreatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(program, ct);
        await _repository.SaveChangesAsync(ct);

        return new TrainingProgramDto(
            program.Id,
            program.Name,
            program.Description,
            program.Level,
            program.CreatedAt
        );
    }
}