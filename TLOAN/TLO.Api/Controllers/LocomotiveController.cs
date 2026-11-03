using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TLO.Api.DTOs;
using TLO.Api.Models;
using TLO.Api.Services;

namespace TLO.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class LocomotiveController : ControllerBase
{
    private readonly ILocomotiveService _locomotiveService;

    public LocomotiveController(ILocomotiveService locomotiveService)
    {
        _locomotiveService = locomotiveService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<LocomotiveDto>), 200)]
    public async Task<IActionResult> GetAll()
    {
        var locos = await _locomotiveService.GetAllAsync();
        var dtos = locos.Select(l => new LocomotiveDto
        {
            LocoId = l.LocoId,
            RailLine = l.RailLine,
            Orientation = l.Orientation,
            X = l.X,
            Y = l.Y,
            Status = l.Status,
            Destination = l.Destination,
            DestId = l.DestId
        }).ToList();
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(LocomotiveDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(string id)
    {
        var l = await _locomotiveService.GetByIdAsync(id);
        if (l == null) return NotFound(new { error = "Locomotive not found" });
        return Ok(new LocomotiveDto
        {
            LocoId = l.LocoId,
            RailLine = l.RailLine,
            Orientation = l.Orientation,
            X = l.X,
            Y = l.Y,
            Status = l.Status,
            Destination = l.Destination,
            DestId = l.DestId
        });
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(LocomotiveDto), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Create([FromBody] LocomotiveCreateRequest request)
    {
        if (request.RailLine < 1 || request.RailLine > 9)
            return BadRequest(new { error = "railLine must be between 1 and 9" });

        var loco = new Locomotive
        {
            LocoId = request.LocoId,
            RailLine = request.RailLine,
            Orientation = request.Orientation,
            X = request.X,
            Y = request.Y,
            Status = request.Status,
            DestId = request.DestId,
            Destination = request.DestId
        };

        try
        {
            var created = await _locomotiveService.CreateAsync(loco);
            return CreatedAtAction(nameof(GetById), new { id = created.LocoId },
                new LocomotiveDto
                {
                    LocoId = created.LocoId,
                    RailLine = created.RailLine,
                    Orientation = created.Orientation,
                    X = created.X,
                    Y = created.Y,
                    Status = created.Status,
                    Destination = created.Destination,
                    DestId = created.DestId
                });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(LocomotiveDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(string id, [FromBody] LocomotiveCreateRequest request)
    {
        var loco = new Locomotive
        {
            LocoId = id,
            RailLine = request.RailLine,
            Orientation = request.Orientation,
            X = request.X,
            Y = request.Y,
            Status = request.Status,
            DestId = request.DestId,
            Destination = request.DestId
        };

        var updated = await _locomotiveService.UpdateAsync(id, loco);
        if (updated == null) return NotFound(new { error = "Locomotive not found" });
        return Ok(new LocomotiveDto
        {
            LocoId = updated.LocoId,
            RailLine = updated.RailLine,
            Orientation = updated.Orientation,
            X = updated.X,
            Y = updated.Y,
            Status = updated.Status,
            Destination = updated.Destination,
            DestId = updated.DestId
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await _locomotiveService.DeleteAsync(id);
        if (!deleted) return NotFound(new { error = "Locomotive not found" });
        return Ok(new { ok = true });
    }
}
