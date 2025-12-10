using System.Globalization;
using TrainMateX.Domain.Entities;

public class UserProfileService
{
    private readonly IUserProfileRepository _repository;

    public UserProfileService(IUserProfileRepository repository)
    {
        _repository = repository;
    }

    public async Task<UserProfile> GetOrCreateAsync(
        string clerkUserId,
        string? name,
        string? email,
        CancellationToken ct = default
    )
    {
        var existing = await _repository.GetByClerkUserIdAsync(clerkUserId, ct);
        if (existing is not null)
        {
            return existing;
        }

        var profile = new UserProfile
        {
            Id = Guid.NewGuid(),
            ClerkUserId = clerkUserId,
            Name = name,
            Email = email,
            CreatedAt = DateTime.UtcNow
        };

        return await _repository.AddAsync(profile, ct);
    }
}