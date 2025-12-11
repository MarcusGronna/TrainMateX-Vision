using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize]
[Route("api/trainingprograms/{trainingProgramId:guid}/workouts")]
public class WorkoutsController : ControllerBase
{
    private readonly WorkoutService _workoutService;

    public WorkoutsController(WorkoutService workoutService)
    {
        _workoutService = workoutService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkoutResponse>>> GetForProgram(
        Guid trainingProgramId,
        Guid userProfileId,
        CancellationToken ct)
    {
        var workouts = await _workoutService.GetForProgramAsync(trainingProgramId, userProfileId, ct);

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
        Guid userProfileId,
        [FromBody] CreateWorkoutRequest request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Name is required");
        }

        var workout = await _workoutService.CreateForProgramAsync(
            trainingProgramId,
            userProfileId,
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
}
