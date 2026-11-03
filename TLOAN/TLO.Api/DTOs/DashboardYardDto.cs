namespace TLO.Api.DTOs;

public class DashboardYardDto
{
    public int ContainersAvailable { get; set; }
    public int ContainersAssigned { get; set; }
    public int RailcarsAvailable { get; set; }
    public int RailcarsLoaded { get; set; }
    public int LocomotivesAvailable { get; set; }
    public int LocomotivesTotal { get; set; }
}
