namespace TLO.Api.DTOs;

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
