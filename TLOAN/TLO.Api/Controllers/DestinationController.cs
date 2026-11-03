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
public class DestinationController : ControllerBase
{
    private readonly IDestinationService _destinationService;

    public DestinationController(IDestinationService destinationService)
    {
        _destinationService = destinationService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<DestinationDto>), 200)]
    public async Task<IActionResult> GetAll()
    {
        var destinations = await _destinationService.GetAllAsync();
        var dtos = destinations.Select(d => new DestinationDto { DestId = d.DestId, Name = d.Name }).ToList();
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(DestinationDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(string id)
    {
        var d = await _destinationService.GetByIdAsync(id);
        if (d == null) return NotFound(new { error = "Destination not found" });
        return Ok(new DestinationDto { DestId = d.DestId, Name = d.Name });
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(DestinationDto), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Create([FromBody] Destination destination)
    {
        if (string.IsNullOrWhiteSpace(destination.DestId) || string.IsNullOrWhiteSpace(destination.Name))
            return BadRequest(new { error = "DestId and Name are required" });

        var created = await _destinationService.CreateAsync(destination);
        return CreatedAtAction(nameof(GetById), new { id = created.DestId },
            new DestinationDto { DestId = created.DestId, Name = created.Name });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(DestinationDto), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Update(string id, [FromBody] Destination destination)
    {
        var updated = await _destinationService.UpdateAsync(id, destination);
        if (updated == null) return NotFound(new { error = "Destination not found" });
        return Ok(new DestinationDto { DestId = updated.DestId, Name = updated.Name });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await _destinationService.DeleteAsync(id);
        if (!deleted) return NotFound(new { error = "Destination not found" });
        return Ok(new { ok = true });
    }
}
