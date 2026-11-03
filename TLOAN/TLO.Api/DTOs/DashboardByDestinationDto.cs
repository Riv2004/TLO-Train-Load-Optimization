namespace TLO.Api.DTOs;

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
