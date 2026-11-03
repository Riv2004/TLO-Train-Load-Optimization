namespace TLO.Api.DTOs;

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
