using TLO.Api.Models;

namespace TLO.Api.Services;

public interface ILocomotiveService
{
    Task<List<Locomotive>> GetAllAsync();
    Task<Locomotive?> GetByIdAsync(string id);
    Task<Locomotive> CreateAsync(Locomotive locomotive);
    Task<Locomotive?> UpdateAsync(string id, Locomotive locomotive);
    Task<bool> DeleteAsync(string id);
}
