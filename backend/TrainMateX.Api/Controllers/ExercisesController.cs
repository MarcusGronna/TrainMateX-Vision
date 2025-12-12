using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ExercisesController : ControllerBase
{
    private readonly ExerciseService _exerciseService;

    public ExercisesController(ExerciseService exerciseService)
    {
        _exerciseService = exerciseService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ExerciseResponse>>> GetAll(
        [FromQuery] ExerciseQuery request,
        CancellationToken ct)
    {
        var exercises = await _exerciseService.GetAllAsync(
            request.MuscleGroup,
            request.Equipment,
            request.Difficulty,
            ct);

        var response = exercises.Select(e => new ExerciseResponse(
            e.Id,
            e.Name,
            e.Description,
            e.MuscleGroup,
            e.Equipment,
            e.Difficulty
        ));

        return Ok(response);
    }
}
