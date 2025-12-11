using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TrainingProgramsController : ControllerBase
{
    private readonly TrainingProgramService _trainingProgramService;
    private readonly UserProfileService _userProfileService;

    public TrainingProgramsController(
        TrainingProgramService trainingProgramService,
        UserProfileService userProfileService
    )
    {
        _trainingProgramService = trainingProgramService;
        _userProfileService = userProfileService;
    }

    [HttpGet]
    public async Task<ActionResult<List<TrainingProgramDto>>> GetAll(CancellationToken ct)
    {
        var clerkUserId = User.FindFirst("sub")?.Value
            ?? throw new InvalidOperationException("Missing Clerk user id claim");

        var name = User.FindFirst("full_name")?.Value;
        var email = User.FindFirstValue("email");

        var profile = await _userProfileService.GetOrCreateAsync(
            clerkUserId,
            name,
            email,
            ct
        );

        var programs = await _trainingProgramService.GetAllForUserAsync(profile.Id, ct);

        return Ok(programs);

    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TrainingProgramDto>> GetById(Guid id, CancellationToken ct)
    {
        var clerkUserId = User.FindFirst("sub")?.Value
            ?? throw new InvalidOperationException("Missing Clerk user id claim");

        var name = User.FindFirst("full_name")?.Value;
        var email = User.FindFirstValue("email");

        var profile = await _userProfileService.GetOrCreateAsync(
            clerkUserId,
            name,
            email,
            ct
        );

        var program = await _trainingProgramService.GetByIdForUserAsync(id, profile.Id, ct);

        if (program is null)
        {
            return NotFound();
        }

        return Ok(program);
    }

    [HttpPost]
    public async Task<ActionResult<TrainingProgramDto>> Create(
        [FromBody] CreateTrainingProgramRequest request,
        CancellationToken ct
    )
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Name is required.");
        }

        var clerkUserId = User.FindFirst("sub")?.Value
            ?? throw new InvalidOperationException("Missing Clerk user id claim");

        var name = User.FindFirst("full_name")?.Value;
        var email = User.FindFirstValue("email");

        var profile = await _userProfileService.GetOrCreateAsync(
            clerkUserId,
            name,
            email,
            ct
        );

        var created = await _trainingProgramService.CreateAsync(profile.Id, request, ct);

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }
}