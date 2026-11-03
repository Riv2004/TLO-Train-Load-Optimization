namespace TLO.Api.Services;

public interface IAuthService
{
    Task<bool> ValidateUserAsync(string username, string password);
    Task<string> GenerateTokenAsync(string username, string role);
}
