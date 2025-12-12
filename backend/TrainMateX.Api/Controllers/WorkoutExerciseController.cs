using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize]
[Route("api/workouts/{workoutId:guid}/exercises")]
public class WorkoutExercisesController : ControllerBase
{
    private readonly WorkoutService _workoutService;
    private readonly UserProfileService _userProfileService;

    public WorkoutExercisesController(WorkoutService workoutService, UserProfileService userProfileService)
    {
        _workoutService = workoutService;
        _userProfileService = userProfileService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkoutExerciseResponse>>> GetForWorkout(
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

        var workoutExercises = await _workoutService.GetExercisesForWorkoutAsync(
            workoutId,
            userProfile.Id,
            ct
        );

        var response = workoutExercises.Select(we => new WorkoutExerciseResponse(
            we.Id,
            we.WorkoutId,
            we.ExerciseId,
            we.Exercise.Name,
            we.Sets,
            we.Reps,
            we.Weight,
            we.Notes,
            we.CreatedAt
        ));

        return Ok(response);
    }

    [HttpPost]
    public async Task<ActionResult<WorkoutExerciseResponse>> Create(
        Guid workoutId,
        [FromBody] CreateWorkoutExerciseRequest request,
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

        if (request.Sets <= 0 || request.Reps <= 0)
        {
            return BadRequest("Sets and Reps must be positive.");
        }

        var we = await _workoutService.AddExerciseToWorkoutAsync(
            workoutId,
            userProfile.Id,
            request.ExerciseId,
            request.Sets,
            request.Reps,
            request.Weight,
            request.Notes,
            ct
        );

        var response = new WorkoutExerciseResponse(
            we.Id,
            we.WorkoutId,
            we.ExerciseId,
            we.Exercise.Name,
            we.Sets,
            we.Reps,
            we.Weight,
            we.Notes,
            we.CreatedAt
        );

        return CreatedAtAction(nameof(GetForWorkout), new { workoutId }, response);
    }
}