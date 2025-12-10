using Microsoft.EntityFrameworkCore;
using TrainMateX.Domain.Entities;
using TrainMateX.Infrastructure.Persistence;

public class UserProfileRepository : IUserProfileRepository
{
    private readonly TrainMateXDbContext _db;

    public UserProfileRepository(TrainMateXDbContext db)
    {
        _db = db;
    }

    public async Task<UserProfile> AddAsync(UserProfile profile, CancellationToken ct = default)
    {
        _db.UserProfiles.Add(profile);
        await _db.SaveChangesAsync(ct);
        return profile;
    }

    public Task<UserProfile?> GetByClerkUserIdAsync(string clerkUserId, CancellationToken ct = default)
    {
        return _db.UserProfiles
            .FirstOrDefaultAsync(x => x.ClerkUserId == clerkUserId, ct);
    }
}