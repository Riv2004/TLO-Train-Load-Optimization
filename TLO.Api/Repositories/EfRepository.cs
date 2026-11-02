using Microsoft.EntityFrameworkCore;
using TLO.Api.Data;
using TLO.Api.Models;

namespace TLO.Api.Repositories;

public class EfRepository<T> : IRepository<T> where T : class
{
    private readonly TloDbContext _context;
    private readonly DbSet<T> _dbSet;

    public EfRepository(TloDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<List<T>> GetAllAsync() => await _dbSet.ToListAsync();

    public async Task<T?> GetByIdAsync(object id) => await _dbSet.FindAsync(id);

    public async Task<T> AddAsync(T entity)
    {
        var entry = await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();
        return entry.Entity;
    }

    public async Task<T> UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public async Task<bool> DeleteAsync(object id)
    {
        var entity = await _dbSet.FindAsync(id);
        if (entity == null) return false;
        _dbSet.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<int> SaveChangesAsync() => await _context.SaveChangesAsync();

    public IQueryable<T> Query() => _dbSet.AsQueryable();
}
