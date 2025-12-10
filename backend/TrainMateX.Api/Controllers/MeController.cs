using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
    public async Task<ActionResult<object>> Get(CancellationToken ct)
    {
        return Ok();
        var clerkUserId = User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(clerkUserId))
        {
            return Unauthorized("Missing Clerk user id");
        }

        // Test data
        string name = "Test";
        string email = "Test@Test";

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