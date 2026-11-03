using TLO.Api.Data;
using TLO.Api.Models;

namespace TLO.Api.Business;

public class LocomotiveService : ILocomotiveService
{
    private readonly TloDbContext _context;

    public LocomotiveService(TloDbContext context)
    {
        _context = context;
    }

    public async Task<List<Locomotive>> GetAllAsync() => await _context.Locomotives.ToListAsync();

    public async Task<Locomotive?> GetByIdAsync(string id) => await _context.Locomotives.FindAsync(id);

    public async Task<Locomotive> CreateAsync(Locomotive locomotive)
    {
        _context.Locomotives.Add(locomotive);
        await _context.SaveChangesAsync();
        return locomotive;
    }

    public async Task<Locomotive?> UpdateAsync(string id, Locomotive locomotive)
    {
        var existing = await _context.Locomotives.FindAsync(id);
        if (existing == null) return null;
        existing.RailLine = locomotive.RailLine;
        existing.Orientation = locomotive.Orientation;
        existing.X = locomotive.X;
        existing.Y = locomotive.Y;
        existing.Status = locomotive.Status;
        existing.Destination = locomotive.Destination;
        existing.DestId = locomotive.DestId;
        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var entity = await _context.Locomotives.FindAsync(id);
        if (entity == null) return false;
        _context.Locomotives.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }
}
