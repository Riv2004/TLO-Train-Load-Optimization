namespace TLO.Api.Models;

public class Container
{
    public string ContainerId { get; set; } = string.Empty;
    public int SizeFt { get; set; } // 20 or 40
    public int Weight { get; set; }
    public double X { get; set; }
    public double Y { get; set; }
    public int YardTier { get; set; } // blockers on top (0 = no dig)
    public string ZoneId { get; set; } = string.Empty; // N-W, S-W, S-E, N-E
    public string Priority { get; set; } = string.Empty; // Critical, High, Normal
    public string Status { get; set; } = string.Empty; // 'Available' or 'ASSIGNED'
    public string DestId { get; set; } = string.Empty;

    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}
