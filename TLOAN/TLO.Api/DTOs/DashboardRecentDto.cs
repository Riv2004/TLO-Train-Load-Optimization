namespace TLO.Api.DTOs;

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
