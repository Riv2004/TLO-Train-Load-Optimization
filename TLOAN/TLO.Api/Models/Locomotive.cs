namespace TLO.Api.Models;

public class Locomotive
{
    public string LocoId { get; set; } = string.Empty;
    public int RailLine { get; set; }
    public string Orientation { get; set; } = string.Empty; // 'H' or 'V'
    public double X { get; set; }
    public double Y { get; set; }
    public string Status { get; set; } = string.Empty; // 'Available' or 'Not Available'
    public string Destination { get; set; } = string.Empty;
    public string DestId { get; set; } = string.Empty;

    public ICollection<LoadPlan> Plans { get; set; } = new List<LoadPlan>();
}
