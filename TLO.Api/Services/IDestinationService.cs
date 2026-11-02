using TLO.Api.Models;

namespace TLO.Api.Services;

public interface IDestinationService
{
    Task<List<Destination>> GetAllAsync();
    Task<Destination?> GetByIdAsync(string id);
    Task<Destination> CreateAsync(Destination destination);
    Task<Destination?> UpdateAsync(string id, Destination destination);
    Task<bool> DeleteAsync(string id);
}
