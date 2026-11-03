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
public class ContainerController : ControllerBase
{
    private readonly IContainerService _containerService;

    public ContainerController(IContainerService containerService)
    {
        _containerService = containerService;
    }

    [HttpGet] 
    [ProducesResponseType(typeof(List<ContainerDto>), 200)]
    public async Task<IActionResult> GetAll([FromQuery] string? destId)
    {
        List<Container> containers;
        if (!string.IsNullOrWhiteSpace(destId))
            containers = await _containerService.GetByDestinationAsync(destId);
        else
            containers = await _containerService.GetAllAsync();

        var dtos = containers.Select(c => new ContainerDto
        {
            ContainerId = c.ContainerId,
            SizeFt = c.SizeFt,
            Weight = c.Weight,
            X = c.X,
            Y = c.Y,
            YardTier = c.YardTier,
            ZoneId = c.ZoneId,
            Priority = c.Priority,
            Status = c.Status,
            DestId = c.DestId
        }).ToList();
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ContainerDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(string id)
    {
        var c = await _containerService.GetByIdAsync(id);
        if (c == null) return NotFound(new { error = "Container not found" });
        return Ok(new ContainerDto
        {
            ContainerId = c.ContainerId,
            SizeFt = c.SizeFt,
            Weight = c.Weight,
            X = c.X,
            Y = c.Y,
            YardTier = c.YardTier,
            ZoneId = c.ZoneId,
            Priority = c.Priority,
            Status = c.Status,
            DestId = c.DestId
        });
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ContainerDto), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Create([FromBody] ContainerCreateRequest request)
    {
        if (request.SizeFt != 20 && request.SizeFt != 40)
            return BadRequest(new { error = "sizeFt must be 20 or 40" });
        if (request.Weight <= 0)
            return BadRequest(new { error = "weight must be above 0" });

        var zoneIds = new[] { "N-W", "S-W", "S-E", "N-E" };
        if (!zoneIds.Contains(request.ZoneId))
            return BadRequest(new { error = "zoneId must be N-W, S-W, S-E or N-E" });
        if (!new[] { "Critical", "High", "Normal" }.Contains(request.Priority))
            return BadRequest(new { error = "priority must be Critical, High or Normal" });

        var container = new Container
        {
            ContainerId = request.ContainerId,
            SizeFt = request.SizeFt,
            Weight = request.Weight,
            X = request.X ?? 0,
            Y = request.Y ?? 0,
            YardTier = request.YardTier,
            ZoneId = request.ZoneId,
            Priority = request.Priority,
            Status = "Available",
            DestId = request.DestId
        };

        try
        {
            var created = await _containerService.CreateAsync(container);
            return CreatedAtAction(nameof(GetById), new { id = created.ContainerId },
                new ContainerDto
                {
                    ContainerId = created.ContainerId,
                    SizeFt = created.SizeFt,
                    Weight = created.Weight,
                    X = created.X,
                    Y = created.Y,
                    YardTier = created.YardTier,
                    ZoneId = created.ZoneId,
                    Priority = created.Priority,
                    Status = created.Status,
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
    [ProducesResponseType(typeof(ContainerDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(string id, [FromBody] ContainerCreateRequest request)
    {
        var container = new Container
        {
            ContainerId = id,
            SizeFt = request.SizeFt,
            Weight = request.Weight,
            X = request.X ?? 0,
            Y = request.Y ?? 0,
            YardTier = request.YardTier,
            ZoneId = request.ZoneId,
            Priority = request.Priority,
            Status = "Available",
            DestId = request.DestId
        };

        var updated = await _containerService.UpdateAsync(id, container);
        if (updated == null) return NotFound(new { error = "Container not found" });
        return Ok(new ContainerDto
        {
            ContainerId = updated.ContainerId,
            SizeFt = updated.SizeFt,
            Weight = updated.Weight,
            X = updated.X,
            Y = updated.Y,
            YardTier = updated.YardTier,
            ZoneId = updated.ZoneId,
            Priority = updated.Priority,
            Status = updated.Status,
            DestId = updated.DestId
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await _containerService.DeleteAsync(id);
        if (!deleted) return NotFound(new { error = "Container not found" });
        return Ok(new { ok = true });
    }
}
