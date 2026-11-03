using TLO.Api.Models;

namespace TLO.Api.Business;

public interface IRailcarService
{
    Task<List<Railcar>> GetAllAsync();
    Task<List<Railcar>> GetByDestinationAsync(string destId);
    Task<Railcar?> GetByIdAsync(string id);
    Task<Railcar> CreateAsync(Railcar railcar);
    Task<Railcar?> UpdateAsync(string id, Railcar railcar);
    Task<bool> DeleteAsync(string id);
}
