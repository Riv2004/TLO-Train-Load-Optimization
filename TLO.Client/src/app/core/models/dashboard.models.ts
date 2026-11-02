export interface PenaltyDto {
  dig: number;
  reposition: number;
  zone: number;
  total: number;
}

export interface DashboardTotalsDto {
  plans: number;
  containersLoaded: number;
  slotUtilPct: number;
  craneTravel: number;
  totalCost: number;
  avgCostPerContainer: number;
  penalty: PenaltyDto;
  penaltySharePct: number;
  lifts: number;
  liftsPerIMU: number;
  unassigned: number;
  avgSavingsPct: number;
}

export interface DashboardByDestinationDto {
  destId: string;
  name: string;
  plans: number;
  containers: number;
  slotUtilPct: number;
  totalCost: number;
  avgCost: number;
  waiting: number;
}

export interface DashboardYardDto {
  containersAvailable: number;
  containersAssigned: number;
  railcarsAvailable: number;
  railcarsLoaded: number;
  locomotivesAvailable: number;
  locomotivesTotal: number;
}

export interface DashboardRecentDto {
  planId: number;
  createdAt: string;
  createdBy: string;
  destName: string;
  locoId: string;
  containers: number;
  slotUtilPct: number;
  totalCost: number;
}

export interface DashboardDto {
  totals: DashboardTotalsDto;
  byDestination: DashboardByDestinationDto[];
  yard: DashboardYardDto;
  recent: DashboardRecentDto[];
}
