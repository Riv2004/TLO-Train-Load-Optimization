using System.Text.Json;
using TLO.Api.Data;
using TLO.Api.DTOs;

namespace TLO.Api.Services;

public interface IDashboardService
{
    DashboardDto GetDashboard();
    object GetSlotUtilizationChart();
    object GetCostByDestinationChart();
    object GetPenaltyBreakdownChart();
}

public class DashboardService : IDashboardService
{
    private readonly TloDbContext _context;

    public DashboardService(TloDbContext context)
    {
        _context = context;
    }

    public DashboardDto GetDashboard()
    {
        var plans = _context.LoadPlans
            .Include(p => p.Assignments)
            .OrderByDescending(p => p.PlanId)
            .ToList();

        var containers = _context.Containers.ToList();
        var railcars = _context.Railcars.ToList();
        var locomotives = _context.Locomotives.ToList();
        var destinations = _context.Destinations.ToList();

        int totalContainersLoaded = 0;
        double totalCraneTravel = 0, totalCost = 0, totalPenalty = 0, totalDig = 0, totalReposition = 0, totalZone = 0;
        int totalSlots = 0, totalLifts = 0, totalUnassigned = 0;
        double totalSavings = 0;

        foreach (var p in plans)
        {
            var kpis = JsonSerializer.Deserialize<KpisDto>(p.KpisJson ?? "{}") ?? new KpisDto();
            totalContainersLoaded += p.Assignments.Count;
            totalCraneTravel += kpis.CraneTravel;
            totalCost += kpis.TotalCost;
            totalPenalty += kpis.Penalty.Total;
            totalDig += kpis.Penalty.Dig;
            totalReposition += kpis.Penalty.Reposition;
            totalZone += kpis.Penalty.Zone;
            totalSlots += kpis.SlotsTotal;
            totalLifts += kpis.Lifts;
            totalUnassigned += kpis.UnassignedCount;
            totalSavings += kpis.SavingsPct;
        }

        var slotUtilPct = totalSlots > 0 ? Math.Round((double)totalContainersLoaded / totalSlots * 100, 2) : 0;
        var avgCost = totalContainersLoaded > 0 ? Math.Round(totalCost / totalContainersLoaded, 2) : 0;
        var penaltySharePct = totalCost > 0 ? Math.Round(totalPenalty / totalCost * 100, 2) : 0;
        var liftsPerIMU = totalContainersLoaded > 0 ? Math.Round((double)totalLifts / totalContainersLoaded, 2) : 0;
        var avgSavingsPct = plans.Count > 0 ? Math.Round(totalSavings / plans.Count, 2) : 0;

        var totals = new DashboardTotalsDto
        {
            Plans = plans.Count,
            ContainersLoaded = totalContainersLoaded,
            SlotUtilPct = slotUtilPct,
            CraneTravel = Math.Round(totalCraneTravel, 2),
            TotalCost = Math.Round(totalCost, 2),
            AvgCostPerContainer = avgCost,
            Penalty = new PenaltyDto
            {
                Dig = Math.Round(totalDig, 2),
                Reposition = Math.Round(totalReposition, 2),
                Zone = Math.Round(totalZone, 2),
                Total = Math.Round(totalPenalty, 2)
            },
            PenaltySharePct = penaltySharePct,
            Lifts = totalLifts,
            LiftsPerIMU = liftsPerIMU,
            Unassigned = totalUnassigned,
            AvgSavingsPct = avgSavingsPct
        };

        var byDestination = destinations.Select(d =>
        {
            var ps = plans.Where(p => p.DestId == d.DestId).ToList();
            var n = ps.Sum(p => p.Assignments.Count);
            var sl = ps.Sum(p =>
            {
                var k = JsonSerializer.Deserialize<KpisDto>(p.KpisJson ?? "{}") ?? new KpisDto();
                return k.SlotsTotal;
            });
            var c = ps.Sum(p =>
            {
                var k = JsonSerializer.Deserialize<KpisDto>(p.KpisJson ?? "{}") ?? new KpisDto();
                return k.TotalCost;
            });
            var waiting = containers.Count(c => c.DestId == d.DestId && c.Status == "Available");

            return new DashboardByDestinationDto
            {
                DestId = d.DestId,
                Name = d.Name,
                Plans = ps.Count,
                Containers = n,
                SlotUtilPct = sl > 0 ? Math.Round((double)n / sl * 100, 2) : 0,
                TotalCost = Math.Round(c, 2),
                AvgCost = n > 0 ? Math.Round(c / n, 2) : 0,
                Waiting = waiting
            };
        }).ToList();

        var yard = new DashboardYardDto
        {
            ContainersAvailable = containers.Count(c => c.Status == "Available"),
            ContainersAssigned = containers.Count(c => c.Status == "ASSIGNED"),
            RailcarsAvailable = railcars.Count(r => r.Status == "Available"),
            RailcarsLoaded = railcars.Count(r => r.Status == "LOADED"),
            LocomotivesAvailable = locomotives.Count(l => l.Status == "Available"),
            LocomotivesTotal = locomotives.Count
        };

        var recent = plans.Take(6).Reverse().Select(p =>
        {
            var k = JsonSerializer.Deserialize<KpisDto>(p.KpisJson ?? "{}") ?? new KpisDto();
            var dest = destinations.FirstOrDefault(d => d.DestId == p.DestId);
            return new DashboardRecentDto
            {
                PlanId = p.PlanId,
                CreatedAt = p.CreatedAt.ToString("o"),
                CreatedBy = p.CreatedBy,
                DestName = dest?.Name ?? p.DestName,
                LocoId = p.LocoId,
                Containers = p.Assignments.Count,
                SlotUtilPct = k.SlotUtilPct,
                TotalCost = k.TotalCost
            };
        }).ToList();

        return new DashboardDto
        {
            Totals = totals,
            ByDestination = byDestination,
            Yard = yard,
            Recent = recent
        };
    }

    public object GetSlotUtilizationChart()
    {
        var plans = _context.LoadPlans.Include(p => p.Assignments).ToList();
        var labels = plans.Select(p => $"Plan {p.PlanId}").ToList();
        var data = plans.Select(p =>
        {
            var kpis = JsonSerializer.Deserialize<KpisDto>(p.KpisJson ?? "{}") ?? new KpisDto();
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
                var kpis = JsonSerializer.Deserialize<KpisDto>(p.KpisJson ?? "{}") ?? new KpisDto();
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
            var kpis = JsonSerializer.Deserialize<KpisDto>(p.KpisJson ?? "{}") ?? new KpisDto();
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
