using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TLO.Api.Services;
using TLO.Api.Data;
using TLO.Api.Models;

namespace TLO.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "PlannerOrAdmin")]
[Produces("application/json")]
public class OptimizationController : ControllerBase
{
    private readonly IOptimizationService _optimizationService;

    public OptimizationController(IOptimizationService optimizationService)
    {
        _optimizationService = optimizationService;
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
            var plan = await _optimizationService.OptimizeAsync(request, username);
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
            var plan = await _optimizationService.OptimizeAsync(request, username);
            var saved = await _optimizationService.SavePlanAsync(plan, username);
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
        var plans = await _optimizationService.GetAllPlansAsync();
        return Ok(plans.Select(MapToDto).ToList());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPlan(int id)
    {
        var plan = await _optimizationService.GetPlanByIdAsync(id);
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
