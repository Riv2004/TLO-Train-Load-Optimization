namespace TLO.Api.DTOs;

public class DashboardDto
{
    public DashboardTotalsDto Totals { get; set; } = new();
    public List<DashboardByDestinationDto> ByDestination { get; set; } = new();
    public DashboardYardDto Yard { get; set; } = new();
    public List<DashboardRecentDto> Recent { get; set; } = new();
}
