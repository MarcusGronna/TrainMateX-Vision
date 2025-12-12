using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize]
[Route("api/trainingprograms/{trainingProgramId:guid}/workouts")]
public class WorkoutsController : ControllerBase
{
    private readonly WorkoutService _workoutService;
    private readonly UserProfileService _userProfileService;

    public WorkoutsController(
        WorkoutService workoutService,
        UserProfileService userProfileService)
    {
        _workoutService = workoutService;
        _userProfileService = userProfileService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkoutResponse>>> GetForProgram(
        Guid trainingProgramId,
        CancellationToken ct)
    {
        var clerkUserId = User.FindFirst("sub")?.Value
            ?? throw new InvalidOperationException("Missing Clerk user id claim");

        var userProfile = await _userProfileService.GetOrCreateAsync(
            clerkUserId,
            name: User.FindFirst("full_name")?.Value,
            email: User.FindFirstValue("email"),
            ct
        );

        var workouts = await _workoutService.GetForProgramAsync(trainingProgramId, userProfile.Id, ct);

        var response = workouts.Select(w => new WorkoutResponse(
            w.Id,
            w.TrainingProgramId,
            w.Name,
            w.DayOfWeek,
            w.Notes,
            w.CreatedAt));

        return Ok(response);
    }

    [HttpPost]
    public async Task<ActionResult<WorkoutResponse>> Create(
        Guid trainingProgramId,
        [FromBody] CreateWorkoutRequest request,
        CancellationToken ct)
    {
        var clerkUserId = User.FindFirst("sub")?.Value
            ?? throw new InvalidOperationException("Missing Clerk user id claim");

        var userProfile = await _userProfileService.GetOrCreateAsync(
            clerkUserId,
            name: User.FindFirst("full_name")?.Value,
            email: User.FindFirstValue("email"),
            ct
        );

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Name is required");
        }

        var workout = await _workoutService.CreateForProgramAsync(
            trainingProgramId,
            userProfile.Id,
            request.Name.Trim(),
            request.DayOfWeek,
            request.Notes,
            ct
        );

        var response = new WorkoutResponse(
            workout.Id,
            workout.TrainingProgramId,
            workout.Name,
            workout.DayOfWeek,
            workout.Notes,
            workout.CreatedAt);

        return CreatedAtAction(nameof(GetForProgram), new { trainingProgramId }, response);
    }

    [HttpPut("{workoutId:guid}")]
    public async Task<ActionResult<WorkoutResponse>> Update(
    Guid trainingProgramId,
    Guid workoutId,
    [FromBody] UpdateWorkoutRequest request,
    CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Name is required");

        var clerkUserId = User.FindFirst("sub")?.Value
            ?? throw new InvalidOperationException("Missing Clerk user id claim");

        var userProfile = await _userProfileService.GetOrCreateAsync(
            clerkUserId,
            name: User.FindFirst("full_name")?.Value,
            email: User.FindFirstValue("email"),
            ct
        );

        var updated = await _workoutService.UpdateForProgramAsync(
            trainingProgramId, workoutId, userProfile.Id, request, ct);

        if (updated is null) return NotFound();

        return Ok(new WorkoutResponse(
            updated.Id,
            updated.TrainingProgramId,
            updated.Name,
            updated.DayOfWeek,
            updated.Notes,
            updated.CreatedAt));
    }

    [HttpDelete("{workoutId:guid}")]
    public async Task<IActionResult> Delete(
        Guid trainingProgramId,
        Guid workoutId,
        CancellationToken ct)
    {
        var clerkUserId = User.FindFirst("sub")?.Value
            ?? throw new InvalidOperationException("Missing Clerk user id claim");

        var userProfile = await _userProfileService.GetOrCreateAsync(
            clerkUserId,
            name: User.FindFirst("full_name")?.Value,
            email: User.FindFirstValue("email"),
            ct
        );

        var deleted = await _workoutService.DeleteForProgramAsync(
            trainingProgramId, workoutId, userProfile.Id, ct);

        if (!deleted) return NotFound();

        return NoContent();
    }

}
