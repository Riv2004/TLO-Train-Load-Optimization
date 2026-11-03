using Microsoft.AspNetCore.Mvc;
using TLO.Api.Business;
using TLO.Api.Models;

namespace TLO.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return Unauthorized(new { error = "Username and password are required" });

        var isValid = await _authService.ValidateUserAsync(request.Username, request.Password);
        if (!isValid)
            return Unauthorized(new { error = "Wrong username or password" });

        var role = request.Username == "admin" ? "admin" : "planner";
        var token = await _authService.GenerateTokenAsync(request.Username, role);

        return Ok(new LoginResponse
        {
            Token = token,
            Username = request.Username,
            Role = role
        });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok(new { ok = true });
    }

    [HttpGet("me")]
    public IActionResult Me()
    {
        var username = User.Identity?.Name ?? "unknown";
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "planner";
        return Ok(new { username, role });
    }
}
