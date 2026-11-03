namespace TLO.Api.DTOs;

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
