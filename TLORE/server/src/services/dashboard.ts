import { Store } from '../store';

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Final KPI dashboard: aggregates every saved plan plus live yard status. */
export function buildDashboard(store: Store) {
  const plans = store.plans;
  const sum = (f: (p: (typeof plans)[number]) => number) => plans.reduce((t, p) => t + f(p), 0);
  const containers = sum((p) => p.lines.length);
  const slots = sum((p) => p.kpis.slotsTotal);
  const cost = sum((p) => p.kpis.totalCost);
  const lifts = sum((p) => p.kpis.lifts);

  return {
    totals: {
      plans: plans.length, containersLoaded: containers,
      slotUtilPct: r2(slots ? (containers / slots) * 100 : 0),
      craneTravel: r2(sum((p) => p.kpis.craneTravel)),
      totalCost: r2(cost), avgCostPerContainer: r2(containers ? cost / containers : 0),
      penalty: {
        dig: r2(sum((p) => p.kpis.penalty.dig)), reposition: r2(sum((p) => p.kpis.penalty.reposition)),
        zone: r2(sum((p) => p.kpis.penalty.zone)), total: r2(sum((p) => p.kpis.penalty.total)),
      },
      penaltySharePct: r2(cost ? (sum((p) => p.kpis.penalty.total) / cost) * 100 : 0),
      lifts, liftsPerIMU: r2(containers ? lifts / containers : 0),
      unassigned: sum((p) => p.kpis.unassignedCount),
      avgSavingsPct: r2(plans.length ? sum((p) => p.kpis.savingsPct) / plans.length : 0),
    },
    byDestination: store.destinations.map((d) => {
      const ps = plans.filter((p) => p.destId === d.destId);
      const n = ps.reduce((t, p) => t + p.lines.length, 0);
      const sl = ps.reduce((t, p) => t + p.kpis.slotsTotal, 0);
      const c = ps.reduce((t, p) => t + p.kpis.totalCost, 0);
      return { destId: d.destId, name: d.name, plans: ps.length, containers: n,
        slotUtilPct: r2(sl ? (n / sl) * 100 : 0), totalCost: r2(c), avgCost: r2(n ? c / n : 0),
        waiting: store.containers.filter((x) => x.destId === d.destId && x.status === 'Available').length };
    }),
    yard: {
      containersAvailable: store.containers.filter((c) => c.status === 'Available').length,
      containersAssigned: store.containers.filter((c) => c.status === 'ASSIGNED').length,
      railcarsAvailable: store.railcars.filter((r) => r.status === 'Available').length,
      railcarsLoaded: store.railcars.filter((r) => r.status === 'LOADED').length,
      locomotivesAvailable: store.locomotives.filter((l) => l.status === 'Available').length,
      locomotivesTotal: store.locomotives.length,
    },
    recent: plans.slice(-6).reverse().map((p) => ({
      planId: p.planId, createdAt: p.createdAt, createdBy: p.createdBy, destName: p.destName, locoId: p.locoId,
      containers: p.lines.length, slotUtilPct: p.kpis.slotUtilPct, totalCost: p.kpis.totalCost,
    })),
  };
}
