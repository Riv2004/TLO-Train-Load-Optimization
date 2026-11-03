using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TLO.Api.Business;
using TLO.Api.Models;

namespace TLO.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "PlannerOrAdmin")]
[Produces("application/json")]
public class PlanController : ControllerBase
{
    private readonly IPlanService _planService;

    public PlanController(IPlanService planService)
    {
        _planService = planService;
    }

    [HttpPost("optimize")]
    public async Task<IActionResult> Optimize([FromBody] TLO.Api.DTOs.PlanRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DestId))
            return BadRequest(new { error = "destId is required" });
        if (request.RailcarCount < 1)
            return BadRequest(new { error = "railcarCount must be 1 or more" });

        var username = User.Identity?.Name ?? "planner";
        try
        {
            var plan = await _planService.OptimizeAsync(request, username);
            return Ok(MapToDto(plan));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> SavePlan([FromBody] TLO.Api.DTOs.PlanRequest request)
    {
        if (string.IsNullOrEmpty(request.DestId))
            return BadRequest(new { error = "destId is required" });

        var username = User.Identity?.Name ?? "planner";
        try
        {
            var plan = await _planService.OptimizeAsync(request, username);
            var saved = await _planService.SavePlanAsync(plan, username);
            return CreatedAtAction(nameof(GetPlan), new { id = saved.PlanId }, MapToDto(saved));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAllPlans()
    {
        var plans = await _planService.GetAllPlansAsync();
        return Ok(plans.Select(MapToDto).ToList());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPlan(int id)
    {
        var plan = await _planService.GetPlanByIdAsync(id);
        if (plan == null) return NotFound(new { error = "Plan not found" });
        return Ok(MapToDto(plan));
    }

    private static TLO.Api.DTOs.PlanDto MapToDto(LoadPlan plan)
    {
        return new TLO.Api.DTOs.PlanDto
        {
            PlanId = plan.PlanId,
            CreatedAt = plan.CreatedAt.ToString("o"),
            CreatedBy = plan.CreatedBy,
            DestId = plan.DestId,
            DestName = plan.DestName,
            LocoId = plan.LocoId,
            RailLine = plan.RailLine,
            Lines = plan.Lines,
            Unassigned = plan.Unassigned,
            Kpis = plan.Kpis,
            LocoCandidates = plan.LocoCandidates
        };
    }
}
