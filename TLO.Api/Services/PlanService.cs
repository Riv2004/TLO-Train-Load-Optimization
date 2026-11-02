using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TLO.Api.Data;
using TLO.Api.DTOs;
using TLO.Api.Models;

namespace TLO.Api.Services;

public interface IPlanService
{
    Task<LoadPlan> OptimizeAsync(PlanRequest request, string createdBy);
    Task<LoadPlan> SavePlanAsync(LoadPlan plan, string createdBy);
    Task<List<LoadPlan>> GetAllPlansAsync();
    Task<LoadPlan?> GetPlanByIdAsync(int id);
}

public class PlanResult
{
    public int PlanId { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public string DestId { get; set; } = string.Empty;
    public string DestName { get; set; } = string.Empty;
    public string LocoId { get; set; } = string.Empty;
    public int RailLine { get; set; }
    public List<PlanLineDto> Lines { get; set; } = new();
    public List<UnassignedDto> Unassigned { get; set; } = new();
    public KpisDto Kpis { get; set; } = new();
    public List<LocoCandidateDto> LocoCandidates { get; set; } = new();
}

public class PlanService : IPlanService
{
    private readonly TloDbContext _context;

    public PlanService(TloDbContext context)
    {
        _context = context;
    }

    public async Task<LoadPlan> OptimizeAsync(PlanRequest request, string createdBy)
    {
        var dest = await _context.Destinations.FindAsync(request.DestId);
        if (dest == null)
            throw new ArgumentException($"Unknown destination {request.DestId}");

        var railcars = await SelectRailcarsAsync(request.DestId, request.RailcarCount);

        var locos = await _context.Locomotives.Where(l => l.Status == "Available").ToListAsync();
        if (request.LocoId != null)
        {
            var named = await _context.Locomotives.FindAsync(request.LocoId);
            if (named == null) throw new ArgumentException($"Locomotive {request.LocoId} not found");
            locos = new List<Locomotive> { named };
        }
        if (locos.Count == 0)
            throw new ArgumentException("No locomotive is available");

        var containers = await _context.Containers.Where(c => c.DestId == request.DestId).ToListAsync();

        var trials = locos.Select(l => Optimize(l, request.DestId, railcars, containers))
            .OrderByDescending(t => t.Lines.Count)
            .ThenBy(t => t.Kpis.AvgCostPerContainer)
            .ThenBy(t => t.LocoId)
            .ToList();

        var best = trials[0];
        best.DestName = dest.Name;

        best.LocoCandidates = trials.Select((t, i) => new LocoCandidateDto
        {
            LocoId = t.LocoId,
            RailLine = t.RailLine,
            Placed = t.Lines.Count,
            TotalCost = t.Kpis.TotalCost,
            AvgCost = t.Kpis.AvgCostPerContainer,
            Chosen = i == 0
        }).ToList();

        return best;
    }

    public async Task<LoadPlan> SavePlanAsync(LoadPlan plan, string createdBy)
    {
        var planEntity = new TLO.Api.Models.LoadPlan
        {
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy,
            DestId = plan.DestId,
            DestName = plan.DestName,
            LocoId = plan.LocoId,
            RailLine = plan.RailLine,
            KpisJson = JsonSerializer.Serialize(plan.Kpis),
            UnassignedJson = JsonSerializer.Serialize(plan.Unassigned),
            LocoCandidatesJson = JsonSerializer.Serialize(plan.LocoCandidates)
        };

        _context.LoadPlans.Add(planEntity);
        await _context.SaveChangesAsync();

        int lineNo = 1;
        foreach (var line in plan.Lines)
        {
            var assignment = new TLO.Api.Models.Assignment
            {
                AssignmentId = Guid.NewGuid().ToString("N"),
                PlanId = planEntity.PlanId,
                LineNo = lineNo++,
                ContainerId = line.ContainerId,
                RailCarId = line.RailCarId,
                WellId = line.WellId,
                SlotId = line.SlotId,
                SlotType = line.SlotType,
                RailLine = line.RailLine,
                Score = line.Score,
                Travel = line.Travel,
                Dig = line.Dig,
                Reposition = line.Reposition,
                Zone = line.Zone,
                Cost = line.Cost,
                Lifts = line.Lifts
            };
            _context.Assignments.Add(assignment);
        }

        // Mark railcars LOADED and containers ASSIGNED
        foreach (var rc in plan.Consist)
        {
            var r = await _context.Railcars.FindAsync(rc.RailCarId);
            if (r != null)
            {
                r.Status = "LOADED";
                r.Order = rc.Order;
                r.X = rc.X;
                r.Y = rc.Y;
                r.Orientation = rc.Orientation;
            }
        }

        foreach (var l in plan.Lines)
        {
            var c = await _context.Containers.FindAsync(l.ContainerId);
            if (c != null) c.Status = "ASSIGNED";
        }

        await _context.SaveChangesAsync();

        plan.PlanId = planEntity.PlanId;
        plan.CreatedAt = planEntity.CreatedAt;
        plan.CreatedBy = planEntity.CreatedBy;
        return plan;
    }

    public async Task<List<LoadPlan>> GetAllPlansAsync()
    {
        return await _context.LoadPlans
            .Include(p => p.Assignments)
            .OrderByDescending(p => p.PlanId)
            .Select(p => new LoadPlan
            {
                PlanId = p.PlanId,
                CreatedAt = p.CreatedAt,
                CreatedBy = p.CreatedBy,
                DestId = p.DestId,
                DestName = p.DestName,
                LocoId = p.LocoId,
                RailLine = p.RailLine,
                Kpis = JsonSerializer.Deserialize<KpisDto>(p.KpisJson ?? "{}") ?? new KpisDto(),
                Unassigned = JsonSerializer.Deserialize<List<UnassignedDto>>(p.UnassignedJson ?? "[]") ?? new List<UnassignedDto>(),
                LocoCandidates = JsonSerializer.Deserialize<List<LocoCandidateDto>>(p.LocoCandidatesJson ?? "[]") ?? new List<LocoCandidateDto>(),
                Lines = p.Assignments.OrderBy(a => a.LineNo).Select(a => new PlanLineDto
                {
                    LineNo = a.LineNo,
                    ContainerId = a.ContainerId,
                    RailCarId = a.RailCarId,
                    WellId = a.WellId,
                    SlotId = a.SlotId,
                    SlotType = a.SlotType,
                    RailLine = a.RailLine,
                    Score = a.Score,
                    Travel = a.Travel,
                    Dig = a.Dig,
                    Reposition = a.Reposition,
                    Zone = a.Zone,
                    Cost = a.Cost,
                    Lifts = a.Lifts
                }).ToList()
            }).ToListAsync();
    }

    public async Task<LoadPlan?> GetPlanByIdAsync(int id)
    {
        var p = await _context.LoadPlans
            .Include(x => x.Assignments)
            .FirstOrDefaultAsync(x => x.PlanId == id);
        if (p == null) return null;

        return new LoadPlan
        {
            PlanId = p.PlanId,
            CreatedAt = p.CreatedAt,
            CreatedBy = p.CreatedBy,
            DestId = p.DestId,
            DestName = p.DestName,
            LocoId = p.LocoId,
            RailLine = p.RailLine,
            Kpis = JsonSerializer.Deserialize<KpisDto>(p.KpisJson ?? "{}") ?? new KpisDto(),
            Unassigned = JsonSerializer.Deserialize<List<UnassignedDto>>(p.UnassignedJson ?? "[]") ?? new List<UnassignedDto>(),
            LocoCandidates = JsonSerializer.Deserialize<List<LocoCandidateDto>>(p.LocoCandidatesJson ?? "[]") ?? new List<LocoCandidateDto>(),
            Lines = p.Assignments.OrderBy(a => a.LineNo).Select(a => new PlanLineDto
            {
                LineNo = a.LineNo,
                ContainerId = a.ContainerId,
                RailCarId = a.RailCarId,
                WellId = a.WellId,
                SlotId = a.SlotId,
                SlotType = a.SlotType,
                RailLine = a.RailLine,
                Score = a.Score,
                Travel = a.Travel,
                Dig = a.Dig,
                Reposition = a.Reposition,
                Zone = a.Zone,
                Cost = a.Cost,
                Lifts = a.Lifts
            }).ToList()
        };
    }

    // ===== Optimization engine (ported from Node.js) =====

    private Task<List<Railcar>> SelectRailcarsAsync(string destId, int count)
    {
        var eligible = _context.Railcars
            .Where(r => r.DestId == destId && r.Status == "Available")
            .OrderBy(r => r.RailCarId)
            .Take(count)
            .ToListAsync();

        return eligible;
    }

    private LoadPlan Optimize(Locomotive loco, string destId, List<Railcar> railcars, List<Container> allContainers)
    {
        // Build consist: pack railcars cumulatively along locomotive's line
        var consist = BuildConsist(loco, railcars, destId);

        // Derive wells and slots
        var (wells, slots) = DeriveWellsAndSlots(consist);

        // Eligible containers: Available + destination match
        var eligibleContainers = allContainers
            .Where(c => c.Status == "Available" && c.DestId == destId)
            .ToList();

        var filledSlotIds = new HashSet<string>();
        var railcarLoadedWeight = consist.ToDictionary(rc => rc.RailCarId, _ => 0);
        var wellLoadedWeight = wells.ToDictionary(w => w.WellId, _ => 0);

        var lines = new List<PlanLineDto>();
        var unassigned = new List<UnassignedDto>();
        double totalTravel = 0, totalDig = 0, totalReposition = 0, totalZone = 0, totalCost = 0;

        foreach (var container in eligibleContainers.OrderByDescending(c => PriorityRank(c.Priority)).ThenBy(c => c.ContainerId))
        {
            var bestCandidate = FindBestCandidate(container, consist, wells, slots,
                filledSlotIds, railcarLoadedWeight, wellLoadedWeight, loco, destId);

            if (bestCandidate == null)
            {
                unassigned.Add(new UnassignedDto
                {
                    ContainerId = container.ContainerId,
                    Reason = "No valid slot found (hard rules R1-R7)"
                });
                continue;
            }

            var (slot, well, railcar, score, travel, dig, reposition, zone, cost, lifts) = bestCandidate;

            filledSlotIds.Add(slot.SlotId);
            railcarLoadedWeight[railcar.RailCarId] += container.Weight;
            wellLoadedWeight[well.WellId] += container.Weight;

            totalTravel += travel;
            totalDig += dig;
            totalReposition += reposition;
            totalZone += zone;
            totalCost += cost;

            lines.Add(new PlanLineDto
            {
                LineNo = lines.Count + 1,
                ContainerId = container.ContainerId,
                RailCarId = railcar.RailCarId,
                WellId = well.WellId,
                SlotId = slot.SlotId,
                SlotType = slot.SlotType,
                RailLine = loco.RailLine,
                Score = score,
                Travel = travel,
                Dig = dig,
                Reposition = reposition,
                Zone = zone,
                Cost = cost,
                Lifts = lifts
            });
        }

        var placed = lines.Count;
        var slotsTotal = slots.Count;
        var slotUtilPct = slotsTotal > 0 ? Math.Round((double)placed / slotsTotal * 100, 2) : 0;
        var avgCost = placed > 0 ? Math.Round(totalCost / placed, 2) : 0;

        return new LoadPlan
        {
            LocoId = loco.LocoId,
            RailLine = loco.RailLine,
            DestId = destId,
            DestName = destId,
            Consist = consist,
            Lines = lines,
            Unassigned = unassigned,
            Kpis = new KpisDto
            {
                SlotsTotal = slotsTotal,
                SlotsFilled = placed,
                SlotUtilPct = slotUtilPct,
                CraneTravel = Math.Round(totalTravel, 2),
                Penalty = new PenaltyDto
                {
                    Dig = Math.Round(totalDig, 2),
                    Reposition = Math.Round(totalReposition, 2),
                    Zone = Math.Round(totalZone, 2),
                    Total = Math.Round(totalDig + totalReposition + totalZone, 2)
                },
                TotalCost = Math.Round(totalCost, 2),
                AvgCostPerContainer = avgCost,
                BaselineAvgCost = avgCost,
                SavingsPct = 0,
                Lifts = lines.Sum(l => l.Lifts),
                LiftsPerIMU = placed > 0 ? Math.Round(lines.Sum(l => l.Lifts) / (double)placed, 2) : 0,
                UnassignedCount = unassigned.Count
            }
        };
    }

    private int PriorityRank(string priority) => priority switch
    {
        "Critical" => 3,
        "High" => 2,
        _ => 1
    };

    private List<Railcar> BuildConsist(Locomotive loco, List<Railcar> railcars, string destId)
    {
        const int WELL_MAX_LENGTH = 40;
        var RAILCAR_LENGTHS = new Dictionary<string, int> { { "A", 2 }, { "B", 4 } };

        var eligible = railcars.Where(r => r.DestId == destId && r.Status == "Available")
            .OrderBy(r => r.RailCarId).ToList();

        var onLine = loco.Orientation == "V" ? (Func<(double x, double y), double>)(p => p.y) : (p => p.x);

        var result = new List<Railcar>();
        double cumulative = 0;

        foreach (var rc in eligible)
        {
            var len = RAILCAR_LENGTHS[rc.Type];
            var center = onLine((loco.X, loco.Y)) + cumulative + len / 2.0;
            var x = loco.Orientation == "V" ? loco.X : center;
            var y = loco.Orientation == "V" ? center : loco.Y;

            result.Add(new Railcar
            {
                RailCarId = rc.RailCarId,
                Type = rc.Type,
                Weight = rc.Weight,
                Status = rc.Status,
                Order = result.Count + 1,
                X = x,
                Y = y,
                Orientation = loco.Orientation,
                DestId = rc.DestId
            });

            cumulative += len;
        }

        return result;
    }

    private (List<Well> wells, List<Slot> slots) DeriveWellsAndSlots(List<Railcar> consist)
    {
        const int WELL_WEIGHT_LIMIT = 70000;
        const int WELL_MAX_LENGTH = 40;

        var wells = new List<Well>();
        var slots = new List<Slot>();

        foreach (var rc in consist)
        {
            var vertical = rc.Orientation == "V";
            var perpOffset = vertical ? -0.4 : 0;
            var paraOffset = vertical ? 0 : -0.4;

            var wellCount = rc.Type == "A" ? 1 : 2;
            for (int w = 1; w <= wellCount; w++)
            {
                var wellId = $"{rc.RailCarId}-W{w}";
                wells.Add(new Well
                {
                    WellId = wellId,
                    RailCarId = rc.RailCarId,
                    MaxLengthFt = WELL_MAX_LENGTH,
                    WeightLimit = WELL_WEIGHT_LIMIT
                });

                foreach (var slotType in new[] { "BOTTOM", "TOP" })
                {
                    var mult = slotType == "BOTTOM" ? -1 : 1;
                    var x = rc.X!.Value + perpOffset * mult;
                    var y = rc.Y!.Value + paraOffset * mult;

                    slots.Add(new Slot
                    {
                        SlotId = $"{wellId}-{slotType}",
                        WellId = wellId,
                        RailCarId = rc.RailCarId,
                        SlotType = slotType,
                        X = x,
                        Y = y
                    });
                }
            }
        }

        return (wells, slots);
    }

    private (Slot slot, Well well, Railcar railcar, double score, double travel, double dig, double reposition, double zone, double cost, int lifts)? FindBestCandidate(
        Container container,
        List<Railcar> consist,
        List<Well> wells,
        List<Slot> slots,
        HashSet<string> filledSlotIds,
        Dictionary<string, int> railcarLoadedWeight,
        Dictionary<string, int> wellLoadedWeight,
        Locomotive loco,
        string planDestId)
    {
        const int WELL_WEIGHT_LIMIT = 70000;

        double bestScore = double.MinValue;
        Slot? bestSlot = null;
        Well? bestWell = null;
        Railcar? bestRailcar = null;
        double bestTravel = 0, bestDig = 0, bestReposition = 0, bestZone = 0, bestCost = 0;
        int bestLifts = 0;

        var previousRailcar = consist.LastOrDefault();

        foreach (var well in wells)
        {
            // R1 - well weight limit (single container)
            if (container.Weight > well.WeightLimit) continue;
            // R2 - length fit
            if (container.SizeFt > well.MaxLengthFt) continue;
            // R7 - combined well weight
            if (wellLoadedWeight[well.WellId] + container.Weight > well.WeightLimit * 2) continue;

            var railcar = consist.FirstOrDefault(r => r.RailCarId == well.RailCarId)!;
            // R6 - railcar status
            if (railcar.Status != "Available") continue;
            // R7 - combined railcar weight
            if (railcarLoadedWeight[railcar.RailCarId] + container.Weight > railcar.Weight) continue;

            foreach (var slot in slots.Where(s => s.WellId == well.WellId && !filledSlotIds.Contains(s.SlotId)))
            {
                // R3 - bottom before top
                if (slot.SlotType == "TOP" && !filledSlotIds.Contains($"{well.WellId}-BOTTOM")) continue;

                // R4 - container availability
                if (container.Status != "Available") continue;
                // R5 - destination match
                if (railcar.DestId != planDestId || container.DestId != planDestId) continue;

                // Compute cost (greedy score = 40×priority + 20×utilization − 1.5×cost)
                var travel = ComputeTravel(loco.X, loco.Y, container.X, container.Y, slot.X, slot.Y);
                var dig = container.YardTier * 6.0;
                var reposition = previousRailcar != null && previousRailcar.RailCarId != railcar.RailCarId
                    ? ComputeReposition(previousRailcar, railcar)
                    : 0;
                var zone = ComputeZone(container.ZoneId, railcar.DestId);
                var cost = 40 * 1 + 20 * 1 - 1.5 * (travel + dig + reposition + zone);
                var lifts = 1 + container.YardTier;

                if (cost > bestScore)
                {
                    bestScore = cost;
                    bestSlot = slot;
                    bestWell = well;
                    bestRailcar = railcar;
                    bestTravel = travel;
                    bestDig = dig;
                    bestReposition = reposition;
                    bestZone = zone;
                    bestCost = cost;
                    bestLifts = lifts;
                }
            }
        }

        if (bestSlot == null) return null;

        previousRailcar = bestRailcar!;

        return (bestSlot, bestWell, bestRailcar!, bestScore, bestTravel, bestDig, bestReposition, bestZone, bestCost, bestLifts);
    }

    private double ComputeTravel(double locoX, double locoY, double contX, double contY, double slotX, double slotY)
    {
        // Crane at (0,0): crane -> container -> slot
        var c1 = Math.Abs(locoX - contX) + Math.Abs(locoY - contY);
        var c2 = Math.Abs(contX - slotX) + Math.Abs(contY - slotY);
        return Math.Round(c1 + c2, 2);
    }

    private double ComputeReposition(Railcar previous, Railcar current)
    {
        // Reposition penalty: 2/unit distance along the line between railcars
        var dist = Math.Abs((previous.X ?? 0) - (current.X ?? 0)) + Math.Abs((previous.Y ?? 0) - (current.Y ?? 0));
        return Math.Round(2 * dist, 2);
    }

    private double ComputeZone(string containerZoneId, string railcarDestId)
    {
        // Zone-hop penalty: 3 if container zone differs from railcar destination's zone
        var destZone = railcarDestId switch
        {
            "MUM_101" => "N-W",
            "DEL_102" => "N-E",
            "KOL_103" => "S-E",
            "MAA_104" => "S-W",
            "BLR_105" => "N-W",
            _ => "N-W"
        };
        return containerZoneId != destZone ? 3.0 : 0;
    }
}
