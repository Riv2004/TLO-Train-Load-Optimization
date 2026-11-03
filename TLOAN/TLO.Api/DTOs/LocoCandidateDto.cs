namespace TLO.Api.DTOs;

public class LocoCandidateDto
{
    public string LocoId { get; set; } = string.Empty;
    public int RailLine { get; set; }
    public int Placed { get; set; }
    public double TotalCost { get; set; }
    public double AvgCost { get; set; }
    public bool Chosen { get; set; }
}
