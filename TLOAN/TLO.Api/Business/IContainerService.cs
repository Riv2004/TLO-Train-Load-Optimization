using TLO.Api.Models;

namespace TLO.Api.Business;

public interface IContainerService
{
    Task<List<Container>> GetAllAsync();
    Task<List<Container>> GetByDestinationAsync(string destId);
    Task<Container?> GetByIdAsync(string id);
    Task<Container> CreateAsync(Container container);
    Task<Container?> UpdateAsync(string id, Container container);
    Task<bool> DeleteAsync(string id);
}
