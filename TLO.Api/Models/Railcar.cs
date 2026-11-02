namespace TLO.Api.Models;

public class Railcar
{
    public string RailCarId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // 'A' or 'B'
    public int Weight { get; set; }
    public string Status { get; set; } = string.Empty; // 'Available' or 'LOADED'
    public int? Order { get; set; }
    public double? X { get; set; }
    public double? Y { get; set; }
    public string? Orientation { get; set; } // 'H', 'V', or null
    public string DestId { get; set; } = string.Empty;

    public ICollection<Well> Wells { get; set; } = new List<Well>();
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}
