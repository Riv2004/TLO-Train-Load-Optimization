// Domain entities (handbook section 1.7), extended for the 9-rail-line Indian yard.
export type Role = 'admin' | 'planner';
export type Priority = 'Critical' | 'High' | 'Normal';
export type SlotType = 'BOTTOM' | 'TOP';
export type ZoneId = 'N-W' | 'S-W' | 'S-E' | 'N-E';

export interface Point { x: number; y: number }
export interface User { username: string; role: Role; salt: string; hash: string }
export interface Destination { destId: string; name: string }

export interface Locomotive {
  locoId: string;
  railLine: number;                 // 1..9
  orientation: 'H' | 'V';           // H = horizontal line through origin, V = vertical line through origin
  coordinate: Point;                // locomotive position on its line
  status: 'Available' | 'Not Available';
  destination: string;              // display name
  destId: string;
}
export interface Railcar {
  railCarId: string;
  type: 'A' | 'B';                  // A = 1 well (2 slots), B = 2 wells (4 slots)
  weight: number;                   // total weight limit (lb)
  status: 'Available' | 'LOADED';
  order: number | null;
  coordinate: Point | null;         // computed relative to the locomotive on its line
  orientation: 'H' | 'V' | null;    // orientation of the line this railcar sits on
  destId: string;
}
export interface Container {
  containerId: string;
  sizeFt: 20 | 40;
  weight: number;
  coordinate: Point;
  yardTier: number;                 // blockers on top (0 = no dig)
  zoneId: ZoneId;
  priority: Priority;
  status: 'Available' | 'ASSIGNED';
  destId: string;
}
export interface Well { wellId: string; railCarId: string; maxLengthFt: number; weightLimit: number }
export interface Slot { slotId: string; wellId: string; railCarId: string; slotType: SlotType; coordinate: Point }

export interface PlanLine {
  lineNo: number;
  containerId: string;
  railCarId: string;
  wellId: string;
  slotId: string;
  slotType: SlotType;
  railLine: number;
  score: number;
  travel: number;                   // crane -> container -> slot
  dig: number;                      // penalty: blockers moved aside
  reposition: number;               // penalty: crane re-aims between railcars along the train
  zone: number;                     // penalty: crane hops between yard zones
  cost: number;                     // travel + penalties
  lifts: number;                    // 1 placement + 1 per blocker moved
}
export interface Kpis {
  slotsTotal: number; slotsFilled: number; slotUtilPct: number;
  craneTravel: number;
  penalty: { dig: number; reposition: number; zone: number; total: number };
  totalCost: number; avgCostPerContainer: number;
  baselineAvgCost: number; savingsPct: number;   // vs naive first-fit sequence
  lifts: number; liftsPerIMU: number; unassignedCount: number;
}
export interface LoadPlan {
  planId?: number; createdAt?: string; createdBy?: string;
  locoId: string; railLine: number; destId: string; destName?: string;
  consist: Railcar[]; lines: PlanLine[];
  unassigned: { containerId: string; reason: string }[];
  kpis: Kpis;
  locoCandidates?: { locoId: string; railLine: number; placed: number; totalCost: number; avgCost: number; chosen: boolean }[];
}
