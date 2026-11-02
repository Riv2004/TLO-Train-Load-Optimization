// Mirrors server/src/types.ts. Keep the two in sync (or move to a shared package later).
export type Role = 'admin' | 'planner';
export interface Point { x: number; y: number }
export interface User { username: string; role: Role }
export interface Destination { destId: string; name: string }
export interface Locomotive { locoId: string; railLine: number; orientation: 'H' | 'V'; coordinate: Point; status: string; destination: string; destId: string }
export interface Railcar { railCarId: string; type: 'A' | 'B'; weight: number; status: string; order: number | null; coordinate: Point | null; orientation: 'H' | 'V' | null; destId: string }
export interface Container { containerId: string; sizeFt: 20 | 40; weight: number; coordinate: Point; yardTier: number; zoneId: string; priority: 'Critical' | 'High' | 'Normal'; status: string; destId: string }
export interface PlanLine { lineNo: number; containerId: string; railCarId: string; wellId: string; slotId: string; slotType: 'BOTTOM' | 'TOP'; railLine: number; score: number; travel: number; dig: number; reposition: number; zone: number; cost: number; lifts: number }
export interface Kpis {
  slotsTotal: number; slotsFilled: number; slotUtilPct: number; craneTravel: number;
  penalty: { dig: number; reposition: number; zone: number; total: number };
  totalCost: number; avgCostPerContainer: number; baselineAvgCost: number; savingsPct: number;
  lifts: number; liftsPerIMU: number; unassignedCount: number;
}
export interface LoadPlan {
  planId?: number; createdAt?: string; createdBy?: string; locoId: string; railLine: number; destId: string; destName?: string;
  consist: Railcar[]; lines: PlanLine[]; unassigned: { containerId: string; reason: string }[]; kpis: Kpis;
  locoCandidates?: { locoId: string; railLine: number; placed: number; totalCost: number; avgCost: number; chosen: boolean }[];
}
export interface Dashboard {
  totals: { plans: number; containersLoaded: number; slotUtilPct: number; craneTravel: number; totalCost: number; avgCostPerContainer: number;
    penalty: { dig: number; reposition: number; zone: number; total: number }; penaltySharePct: number; lifts: number; liftsPerIMU: number; unassigned: number; avgSavingsPct: number };
  byDestination: { destId: string; name: string; plans: number; containers: number; slotUtilPct: number; totalCost: number; avgCost: number; waiting: number }[];
  yard: { containersAvailable: number; containersAssigned: number; railcarsAvailable: number; railcarsLoaded: number; locomotivesAvailable: number; locomotivesTotal: number };
  recent: { planId: number; createdAt: string; createdBy: string; destName: string; locoId: string; containers: number; slotUtilPct: number; totalCost: number }[];
}
