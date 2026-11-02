using TLO.Api.Data;
using TLO.Api.Models;

namespace TLO.Api.Services;

public class DestinationService : IDestinationService
{
    private readonly TloDbContext _context;

    public DestinationService(TloDbContext context)
    {
        _context = context;
    }

    public async Task<List<Destination>> GetAllAsync() => await _context.Destinations.ToListAsync();

    public async Task<Destination?> GetByIdAsync(string id) => await _context.Destinations.FindAsync(id);

    public async Task<Destination> CreateAsync(Destination destination)
    {
        _context.Destinations.Add(destination);
        await _context.SaveChangesAsync();
        return destination;
    }

    public async Task<Destination?> UpdateAsync(string id, Destination destination)
    {
        var existing = await _context.Destinations.FindAsync(id);
        if (existing == null) return null;
        existing.Name = destination.Name;
        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var entity = await _context.Destinations.FindAsync(id);
        if (entity == null) return false;
        _context.Destinations.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }
}
