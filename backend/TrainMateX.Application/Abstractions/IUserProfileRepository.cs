using TrainMateX.Domain.Entities;

public interface IUserProfileRepository
{
    Task<UserProfile?> GetByClerkUserIdAsync(
        string clerkUserId,
        CancellationToken ct = default
    );

    Task<UserProfile> AddAsync(
        UserProfile profile,
        CancellationToken ct = default
    );
}