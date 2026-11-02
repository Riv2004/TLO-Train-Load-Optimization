namespace TLO.Api.DTOs;

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

public class DestinationDto
{
    public string DestId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class LocomotiveDto
{
    public string LocoId { get; set; } = string.Empty;
    public int RailLine { get; set; }
    public string Orientation { get; set; } = string.Empty;
    public double X { get; set; }
    public double Y { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public string DestId { get; set; } = string.Empty;
}

public class LocomotiveCreateRequest
{
    public string LocoId { get; set; } = string.Empty;
    public int RailLine { get; set; }
    public string Orientation { get; set; } = string.Empty;
    public double X { get; set; }
    public double Y { get; set; }
    public string Status { get; set; } = string.Empty;
    public string DestId { get; set; } = string.Empty;
}

public class RailcarDto
{
    public string RailCarId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Weight { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? Order { get; set; }
    public double? X { get; set; }
    public double? Y { get; set; }
    public string? Orientation { get; set; }
    public string DestId { get; set; } = string.Empty;
}

public class RailcarCreateRequest
{
    public string RailCarId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Weight { get; set; }
    public string Status { get; set; } = string.Empty;
    public string DestId { get; set; } = string.Empty;
}

public class ContainerDto
{
    public string ContainerId { get; set; } = string.Empty;
    public int SizeFt { get; set; }
    public int Weight { get; set; }
    public double X { get; set; }
    public double Y { get; set; }
    public int YardTier { get; set; }
    public string ZoneId { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string DestId { get; set; } = string.Empty;
}

public class ContainerCreateRequest
{
    public string ContainerId { get; set; } = string.Empty;
    public int SizeFt { get; set; }
    public int Weight { get; set; }
    public double? X { get; set; }
    public double? Y { get; set; }
    public int YardTier { get; set; }
    public string ZoneId { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string DestId { get; set; } = string.Empty;
}

public class PlanRequest
{
    public string DestId { get; set; } = string.Empty;
    public int RailcarCount { get; set; }
    public string? LocoId { get; set; }
}

public class PlanLineDto
{
    public int LineNo { get; set; }
    public string ContainerId { get; set; } = string.Empty;
    public string RailCarId { get; set; } = string.Empty;
    public string WellId { get; set; } = string.Empty;
    public string SlotId { get; set; } = string.Empty;
    public string SlotType { get; set; } = string.Empty;
    public int RailLine { get; set; }
    public double Score { get; set; }
    public double Travel { get; set; }
    public double Dig { get; set; }
    public double Reposition { get; set; }
    public double Zone { get; set; }
    public double Cost { get; set; }
    public int Lifts { get; set; }
}

public class KpisDto
{
    public int SlotsTotal { get; set; }
    public int SlotsFilled { get; set; }
    public double SlotUtilPct { get; set; }
    public double CraneTravel { get; set; }
    public PenaltyDto Penalty { get; set; } = new();
    public double TotalCost { get; set; }
    public double AvgCostPerContainer { get; set; }
    public double BaselineAvgCost { get; set; }
    public double SavingsPct { get; set; }
    public int Lifts { get; set; }
    public double LiftsPerIMU { get; set; }
    public int UnassignedCount { get; set; }
}

public class PenaltyDto
{
    public double Dig { get; set; }
    public double Reposition { get; set; }
    public double Zone { get; set; }
    public double Total { get; set; }
}

public class LocoCandidateDto
{
    public string LocoId { get; set; } = string.Empty;
    public int RailLine { get; set; }
    public int Placed { get; set; }
    public double TotalCost { get; set; }
    public double AvgCost { get; set; }
    public bool Chosen { get; set; }
}

public class PlanDto
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

public class UnassignedDto
{
    public string ContainerId { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}

public class DashboardTotalsDto
{
    public int Plans { get; set; }
    public int ContainersLoaded { get; set; }
    public double SlotUtilPct { get; set; }
    public double CraneTravel { get; set; }
    public double TotalCost { get; set; }
    public double AvgCostPerContainer { get; set; }
    public PenaltyDto Penalty { get; set; } = new();
    public double PenaltySharePct { get; set; }
    public int Lifts { get; set; }
    public double LiftsPerIMU { get; set; }
    public int Unassigned { get; set; }
    public double AvgSavingsPct { get; set; }
}

public class DashboardByDestinationDto
{
    public string DestId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Plans { get; set; }
    public int Containers { get; set; }
    public double SlotUtilPct { get; set; }
    public double TotalCost { get; set; }
    public double AvgCost { get; set; }
    public int Waiting { get; set; }
}

public class DashboardYardDto
{
    public int ContainersAvailable { get; set; }
    public int ContainersAssigned { get; set; }
    public int RailcarsAvailable { get; set; }
    public int RailcarsLoaded { get; set; }
    public int LocomotivesAvailable { get; set; }
    public int LocomotivesTotal { get; set; }
}

public class DashboardRecentDto
{
    public int PlanId { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public string DestName { get; set; } = string.Empty;
    public string LocoId { get; set; } = string.Empty;
    public int Containers { get; set; }
    public double SlotUtilPct { get; set; }
    public double TotalCost { get; set; }
}

public class DashboardDto
{
    public DashboardTotalsDto Totals { get; set; } = new();
    public List<DashboardByDestinationDto> ByDestination { get; set; } = new();
    public DashboardYardDto Yard { get; set; } = new();
    public List<DashboardRecentDto> Recent { get; set; } = new();
}

public class UserDto
{
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

public class HealthResponse
{
    public string Status { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
}
