namespace TLO.Api.DTOs;

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
