using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TLO.Api.Data;

namespace TLO.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin")]
[Produces("application/json")]
public class ResetController : ControllerBase
{
    private readonly TloDbContext _context;

    public ResetController(TloDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    [ProducesResponseType(typeof(object), 200)]
    public async Task<IActionResult> Reset()
    {
        // Clear plan data (assignments then plans)
        _context.Assignments.RemoveRange(_context.Assignments);
        _context.LoadPlans.RemoveRange(_context.LoadPlans);

        // Reset railcar and container statuses
        foreach (var rc in _context.Railcars)
            rc.Status = "Available";
        foreach (var c in _context.Containers)
            c.Status = "Available";

        await _context.SaveChangesAsync();
        return Ok(new { ok = true, message = "Yard reset to initial state" });
    }
}
