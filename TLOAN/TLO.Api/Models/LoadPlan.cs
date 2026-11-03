using System.ComponentModel.DataAnnotations.Schema;
using TLO.Api.DTOs;

namespace TLO.Api.Models;

public class LoadPlan
{
    public int PlanId { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string DestId { get; set; } = string.Empty;
    public string DestName { get; set; } = string.Empty;
    public string LocoId { get; set; } = string.Empty;
    public int RailLine { get; set; }

    // JSON persistence columns
    public string? KpisJson { get; set; }
    public string? UnassignedJson { get; set; }
    public string? LocoCandidatesJson { get; set; }

    // In-memory result properties (not mapped to DB)
    [NotMapped]
    public List<Railcar> Consist { get; set; } = new();
    [NotMapped]
    public List<PlanLineDto> Lines { get; set; } = new();
    [NotMapped]
    public List<UnassignedDto> Unassigned { get; set; } = new();
    [NotMapped]
    public KpisDto Kpis { get; set; } = new();
    [NotMapped]
    public List<LocoCandidateDto> LocoCandidates { get; set; } = new();

    public Locomotive Locomotive { get; set; } = null!;
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}
