import { Container, LoadPlan, Locomotive, PlanLine, Priority, Railcar, Slot } from '../types';
import { checkRules } from '../rules/rules';
import { buildConsist, deriveWellsAndSlots, WELL_WEIGHT_LIMIT } from './planningInputService';

/**
 * Tunable cost model. Cost = crane travel + penalties for EXTRA crane movement:
 *  - dig:   each blocker above a buried container needs an extra lift + set-aside
 *  - reposition: crane re-aims along the train between consecutive drops (per unit of distance)
 *  - zone:  crane hops to a different yard zone than the previous pick
 * Score (maximised) rewards priority and slot utilization and subtracts cost.
 */
export const CONFIG = {
  weights: { priority: 40, utilization: 20, cost: 1.5 },
  digPenaltyPerBlocker: 6,
  repositionPenalty: 2,
  zoneHopPenalty: 3,
};
const PRIORITY_SCORE: Record<Priority, number> = { Critical: 3, High: 2, Normal: 1 };
const ORIGIN = { x: 0, y: 0 }; // crane fixed at (0,0)

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const r2 = (n: number) => Math.round(n * 100) / 100;

export interface Prev { slotPos: { x: number; y: number } | null; zoneId: string | null }

export function moveCost(c: Container, s: Slot, prev: Prev) {
  const travel = dist(ORIGIN, c.coordinate) + dist(c.coordinate, s.coordinate);
  const dig = c.yardTier * CONFIG.digPenaltyPerBlocker;
  const reposition = prev.slotPos === null ? 0 : dist(prev.slotPos, s.coordinate) * CONFIG.repositionPenalty;
  const zone = prev.zoneId === null || prev.zoneId === c.zoneId ? 0 : CONFIG.zoneHopPenalty;
  return { travel, dig, reposition, zone, total: travel + dig + reposition + zone };
}
export function scoreOf(c: Container, cost: number) {
  return CONFIG.weights.priority * PRIORITY_SCORE[c.priority]
    + CONFIG.weights.utilization * (c.sizeFt === 40 ? 1 : 0.5)
    - CONFIG.weights.cost * cost;
}

/**
 * Greedy Next Best Executable Crane Move: each step lists every executable slot (BOTTOM, or TOP once
 * BOTTOM is filled) x every container passing hard rules R1-R7, takes the best score given where the
 * crane just worked, and repeats. Deterministic (ties break on container ID, then slot ID).
 */
export function optimize(loco: Locomotive, destId: string, railcars: Railcar[], containers: Container[]): LoadPlan {
  const consist = buildConsist(loco, railcars, destId);
  const { wells, slots } = deriveWellsAndSlots(consist);
  const wellById = new Map(wells.map((w) => [w.wellId, w]));
  const carById = new Map(consist.map((r) => [r.railCarId, r]));
  const pool = containers.filter((c) => c.status === 'Available' && c.destId === destId)
    .map((c) => ({ ...c })).sort((a, b) => a.containerId.localeCompare(b.containerId));

  const placed = new Set<string>(), filled = new Set<string>();
  const wellWt = new Map<string, number>(), carWt = new Map<string, number>();
  const legal = (c: Container, s: Slot) => checkRules({
    container: c, railcar: carById.get(s.railCarId)!, well: wellById.get(s.wellId)!, slot: s, planDestId: destId,
    filledSlotIds: filled, railcarLoadedWeight: carWt.get(s.railCarId) ?? 0, wellLoadedWeight: wellWt.get(s.wellId) ?? 0,
  }).ok;
  const commit = (c: Container, s: Slot) => {
    placed.add(c.containerId); filled.add(s.slotId);
    wellWt.set(s.wellId, (wellWt.get(s.wellId) ?? 0) + c.weight);
    carWt.set(s.railCarId, (carWt.get(s.railCarId) ?? 0) + c.weight);
  };

  const lines: PlanLine[] = [];
  let prev: Prev = { slotPos: null, zoneId: null };
  while (true) {
    let best: { c: Container; s: Slot; cost: ReturnType<typeof moveCost>; score: number } | null = null;
    for (const s of slots) {
      if (filled.has(s.slotId)) continue;
      for (const c of pool) {
        if (placed.has(c.containerId) || !legal(c, s)) continue;
        const cost = moveCost(c, s, prev);
        const score = scoreOf(c, cost.total);
        if (!best || score > best.score || (score === best.score &&
          (c.containerId < best.c.containerId || (c.containerId === best.c.containerId && s.slotId < best.s.slotId))))
          best = { c, s, cost, score };
      }
    }
    if (!best) break;
    commit(best.c, best.s);
    prev = { slotPos: best.s.coordinate, zoneId: best.c.zoneId };
    lines.push({
      lineNo: lines.length + 1, containerId: best.c.containerId, railCarId: best.s.railCarId, wellId: best.s.wellId,
      slotId: best.s.slotId, slotType: best.s.slotType, railLine: loco.railLine, score: r2(best.score),
      travel: r2(best.cost.travel), dig: r2(best.cost.dig), reposition: r2(best.cost.reposition), zone: r2(best.cost.zone),
      cost: r2(best.cost.total), lifts: 1 + best.c.yardTier,
    });
  }

  const unassigned = pool.filter((c) => !placed.has(c.containerId)).map((c) => ({
    containerId: c.containerId,
    reason: c.weight > WELL_WEIGHT_LIMIT ? `R1: ${c.weight.toLocaleString()} lb exceeds the ${WELL_WEIGHT_LIMIT.toLocaleString()} lb well limit`
      : filled.size === slots.length ? 'All slots on the selected railcars are full' : 'Remaining slots cannot take it (weight limits)',
  }));

  const sum = (f: (l: PlanLine) => number) => r2(lines.reduce((t, l) => t + f(l), 0));
  const penalty = { dig: sum((l) => l.dig), reposition: sum((l) => l.reposition), zone: sum((l) => l.zone), total: 0 };
  penalty.total = r2(penalty.dig + penalty.reposition + penalty.zone);
  const craneTravel = sum((l) => l.travel), totalCost = sum((l) => l.cost), liftCount = sum((l) => l.lifts);
  const avg = lines.length ? totalCost / lines.length : 0;
  const base = baselineAvgCost(slots, pool, legal, commit, () => { placed.clear(); filled.clear(); wellWt.clear(); carWt.clear(); });
  return {
    locoId: loco.locoId, railLine: loco.railLine, destId, consist, lines, unassigned,
    kpis: {
      slotsTotal: slots.length, slotsFilled: lines.length, slotUtilPct: r2(slots.length ? (lines.length / slots.length) * 100 : 0),
      craneTravel, penalty, totalCost, avgCostPerContainer: r2(avg),
      baselineAvgCost: r2(base), savingsPct: base > 0 ? r2(((base - avg) / base) * 100) : 0,
      lifts: liftCount, liftsPerIMU: r2(lines.length ? liftCount / lines.length : 0), unassignedCount: unassigned.length,
    },
  };
}

/** Naive comparison: fill slots in order with the first legal container by ID, using the same cost model. */
function baselineAvgCost(slots: Slot[], pool: Container[],
  legal: (c: Container, s: Slot) => boolean, commit: (c: Container, s: Slot) => void, reset: () => void) {
  reset();
  const used = new Set<string>();
  let prev: Prev = { slotPos: null, zoneId: null }, total = 0, n = 0;
  for (const s of slots) {
    const c = pool.find((x) => !used.has(x.containerId) && legal(x, s));
    if (!c) continue;
    used.add(c.containerId); commit(c, s);
    total += moveCost(c, s, prev).total; n++;
    prev = { slotPos: s.coordinate, zoneId: c.zoneId };
  }
  return n ? total / n : 0;
}
