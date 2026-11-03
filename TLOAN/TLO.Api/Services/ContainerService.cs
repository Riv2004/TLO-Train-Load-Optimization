using TLO.Api.Data;
using TLO.Api.Models;

namespace TLO.Api.Services;

public class ContainerService : IContainerService
{
    private readonly TloDbContext _context;

    public ContainerService(TloDbContext context)
    {
        _context = context;
    }

    public async Task<List<Container>> GetAllAsync() => await _context.Containers.ToListAsync();

    public async Task<List<Container>> GetByDestinationAsync(string destId) =>
        await _context.Containers.Where(c => c.DestId == destId).ToListAsync();

    public async Task<Container?> GetByIdAsync(string id) => await _context.Containers.FindAsync(id);

    public async Task<Container> CreateAsync(Container container)
    {
        _context.Containers.Add(container);
        await _context.SaveChangesAsync();
        return container;
    }

    public async Task<Container?> UpdateAsync(string id, Container container)
    {
        var existing = await _context.Containers.FindAsync(id);
        if (existing == null) return null;
        existing.SizeFt = container.SizeFt;
        existing.Weight = container.Weight;
        existing.X = container.X;
        existing.Y = container.Y;
        existing.YardTier = container.YardTier;
        existing.ZoneId = container.ZoneId;
        existing.Priority = container.Priority;
        existing.Status = container.Status;
        existing.DestId = container.DestId;
        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var entity = await _context.Containers.FindAsync(id);
        if (entity == null) return false;
        _context.Containers.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }
}
