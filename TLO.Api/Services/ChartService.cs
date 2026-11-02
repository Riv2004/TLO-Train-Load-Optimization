using System.Text.Json;
using TLO.Api.Data;
using TLO.Api.Models;

namespace TLO.Api.Services;

public class ChartService : IChartService
{
    private readonly TloDbContext _context;

    public ChartService(TloDbContext context)
    {
        _context = context;
    }

    public object GetSlotUtilizationChart()
    {
        var plans = _context.LoadPlans.Include(p => p.Assignments).ToList();
        var labels = plans.Select(p => $"Plan {p.PlanId}").ToList();
        var data = plans.Select(p =>
        {
            var kpis = JsonSerializer.Deserialize<KpisDto>(p.Kpis ?? "{}") ?? new KpisDto();
            return kpis.SlotUtilPct;
        }).ToList();

        return new { labels, data };
    }

    public object GetCostByDestinationChart()
    {
        var plans = _context.LoadPlans.Include(p => p.Assignments).ToList();
        var byDest = plans.GroupBy(p => p.DestName).Select(g => new
        {
            label = g.Key,
            totalCost = Math.Round(g.Sum(p =>
            {
                var kpis = JsonSerializer.Deserialize<KpisDto>(p.Kpis ?? "{}") ?? new KpisDto();
                return kpis.TotalCost;
            }), 2),
            containerCount = g.Sum(p => p.Assignments.Count)
        }).ToList();

        return new { labels = byDest.Select(x => x.label).ToList(), data = byDest.Select(x => x.totalCost).ToList() };
    }

    public object GetPenaltyBreakdownChart()
    {
        var plans = _context.LoadPlans.Include(p => p.Assignments).ToList();
        double totalDig = 0, totalReposition = 0, totalZone = 0;

        foreach (var p in plans)
        {
            var kpis = JsonSerializer.Deserialize<KpisDto>(p.Kpis ?? "{}") ?? new KpisDto();
            totalDig += kpis.Penalty.Dig;
            totalReposition += kpis.Penalty.Reposition;
            totalZone += kpis.Penalty.Zone;
        }

        return new
        {
            labels = new[] { "Dig", "Reposition", "Zone" },
            data = new[] { Math.Round(totalDig, 2), Math.Round(totalReposition, 2), Math.Round(totalZone, 2) }
        };
    }
}
