using TLO.Api.Data;
using TLO.Api.Models;

namespace TLO.Api.Business;

public class RailcarService : IRailcarService
{
    private readonly TloDbContext _context;

    public RailcarService(TloDbContext context)
    {
        _context = context;
    }

    public async Task<List<Railcar>> GetAllAsync() => await _context.Railcars.ToListAsync();

    public async Task<List<Railcar>> GetByDestinationAsync(string destId) =>
        await _context.Railcars.Where(r => r.DestId == destId).ToListAsync();

    public async Task<Railcar?> GetByIdAsync(string id) => await _context.Railcars.FindAsync(id);

    public async Task<Railcar> CreateAsync(Railcar railcar)
    {
        _context.Railcars.Add(railcar);
        await _context.SaveChangesAsync();
        return railcar;
    }

    public async Task<Railcar?> UpdateAsync(string id, Railcar railcar)
    {
        var existing = await _context.Railcars.FindAsync(id);
        if (existing == null) return null;
        existing.Type = railcar.Type;
        existing.Weight = railcar.Weight;
        existing.Status = railcar.Status;
        existing.Order = railcar.Order;
        existing.X = railcar.X;
        existing.Y = railcar.Y;
        existing.Orientation = railcar.Orientation;
        existing.DestId = railcar.DestId;
        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var entity = await _context.Railcars.FindAsync(id);
        if (entity == null) return false;
        _context.Railcars.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }
}
