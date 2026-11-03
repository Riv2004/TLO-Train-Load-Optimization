namespace TLO.Api.DTOs;

public class PlanRequest
{
    public string DestId { get; set; } = string.Empty;
    public int RailcarCount { get; set; }
    public string? LocoId { get; set; }
}
