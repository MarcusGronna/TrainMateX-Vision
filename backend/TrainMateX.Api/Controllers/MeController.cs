using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

// [Authorize]
[ApiController]
[Route("api/[controller]")]
public class MeController : ControllerBase
{
    private readonly UserProfileService _userProfileService;

    public MeController(UserProfileService userProfileService)
    {
        _userProfileService = userProfileService;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var clerkUserId = User.FindFirst("sub")?.Value
            ?? throw new InvalidOperationException("Missing Clerk user id claim");

        // Test data
        string? name = User.FindFirst("full_name")?.Value;
        string? email = User.FindFirstValue("email");

        var profile = await _userProfileService.GetOrCreateAsync(
            clerkUserId,
            name,
            email,
            ct
        );

        return Ok(new
        {
            profile.Id,
            profile.ClerkUserId,
            profile.Name,
            profile.Email
        });
    }
}