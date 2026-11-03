export interface PlanRequest {
  destId: string;
  railcarCount: number;
  locoId?: string;
}

export interface PlanLineDto {
  lineNo: number;
  containerId: string;
  railCarId: string;
  wellId: string;
  slotId: string;
  slotType: string;
  railLine: number;
  score: number;
  travel: number;
  dig: number;
  reposition: number;
  zone: number;
  cost: number;
  lifts: number;
}

export interface PenaltyDto {
  dig: number;
  reposition: number;
  zone: number;
  total: number;
}

export interface KpisDto {
  slotsTotal: number;
  slotsFilled: number;
  slotUtilPct: number;
  craneTravel: number;
  penalty: PenaltyDto;
  totalCost: number;
  avgCostPerContainer: number;
  baselineAvgCost: number;
  savingsPct: number;
  lifts: number;
  liftsPerIMU: number;
  unassignedCount: number;
}

export interface LocoCandidateDto {
  locoId: string;
  railLine: number;
  placed: number;
  totalCost: number;
  avgCost: number;
  chosen: boolean;
}

export interface UnassignedDto {
  containerId: string;
  reason: string;
}

export interface PlanDto {
  planId: number;
  createdAt: string;
  createdBy: string;
  destId: string;
  destName: string;
  locoId: string;
  railLine: number;
  lines: PlanLineDto[];
  unassigned: UnassignedDto[];
  kpis: KpisDto;
  locoCandidates: LocoCandidateDto[];
}
