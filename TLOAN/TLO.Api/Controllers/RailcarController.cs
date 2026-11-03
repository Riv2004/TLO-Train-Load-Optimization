using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TLO.Api.DTOs;
using TLO.Api.Models;
using TLO.Api.Business;

namespace TLO.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class RailcarController : ControllerBase
{
    private readonly IRailcarService _railcarService;

    public RailcarController(IRailcarService railcarService)
    {
        _railcarService = railcarService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<RailcarDto>), 200)]
    public async Task<IActionResult> GetAll([FromQuery] string? destId)
    {
        List<Railcar> railcars;
        if (!string.IsNullOrWhiteSpace(destId))
            railcars = await _railcarService.GetByDestinationAsync(destId);
        else
            railcars = await _railcarService.GetAllAsync();

        var dtos = railcars.Select(r => new RailcarDto
        {
            RailCarId = r.RailCarId,
            Type = r.Type,
            Weight = r.Weight,
            Status = r.Status,
            Order = r.Order,
            X = r.X,
            Y = r.Y,
            Orientation = r.Orientation,
            DestId = r.DestId
        }).ToList();
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(RailcarDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(string id)
    {
        var r = await _railcarService.GetByIdAsync(id);
        if (r == null) return NotFound(new { error = "Railcar not found" });
        return Ok(new RailcarDto
        {
            RailCarId = r.RailCarId,
            Type = r.Type,
            Weight = r.Weight,
            Status = r.Status,
            Order = r.Order,
            X = r.X,
            Y = r.Y,
            Orientation = r.Orientation,
            DestId = r.DestId
        });
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(RailcarDto), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Create([FromBody] RailcarCreateRequest request)
    {
        if (request.Type != "A" && request.Type != "B")
            return BadRequest(new { error = "type must be A or B" });

        var railcar = new Railcar
        {
            RailCarId = request.RailCarId,
            Type = request.Type,
            Weight = request.Weight,
            Status = request.Status,
            Order = null,
            X = null,
            Y = null,
            Orientation = null,
            DestId = request.DestId
        };

        try
        {
            var created = await _railcarService.CreateAsync(railcar);
            return CreatedAtAction(nameof(GetById), new { id = created.RailCarId },
                new RailcarDto
                {
                    RailCarId = created.RailCarId,
                    Type = created.Type,
                    Weight = created.Weight,
                    Status = created.Status,
                    Order = created.Order,
                    X = created.X,
                    Y = created.Y,
                    Orientation = created.Orientation,
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
    [ProducesResponseType(typeof(RailcarDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(string id, [FromBody] RailcarCreateRequest request)
    {
        var railcar = new Railcar
        {
            RailCarId = id,
            Type = request.Type,
            Weight = request.Weight,
            Status = request.Status,
            DestId = request.DestId
        };

        var updated = await _railcarService.UpdateAsync(id, railcar);
        if (updated == null) return NotFound(new { error = "Railcar not found" });
        return Ok(new RailcarDto
        {
            RailCarId = updated.RailCarId,
            Type = updated.Type,
            Weight = updated.Weight,
            Status = updated.Status,
            Order = updated.Order,
            X = updated.X,
            Y = updated.Y,
            Orientation = updated.Orientation,
            DestId = updated.DestId
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await _railcarService.DeleteAsync(id);
        if (!deleted) return NotFound(new { error = "Railcar not found" });
        return Ok(new { ok = true });
    }
}
