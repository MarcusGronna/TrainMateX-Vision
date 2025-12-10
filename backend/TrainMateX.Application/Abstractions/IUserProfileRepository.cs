using TrainMateX.Domain.Entities;

public interface IUserProfileRepository
{
    Task<UserProfile?> GetByClerkUserIdAsync(
        string clerUserId,
        CancellationToken ct = default
    );

    Task<UserProfile> AddAsync(
        UserProfile profile,
        CancellationToken ct = default
    );
}