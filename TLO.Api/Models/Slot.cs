namespace TLO.Api.Models;

public class Slot
{
    public string SlotId { get; set; } = string.Empty;
    public string WellId { get; set; } = string.Empty;
    public string RailCarId { get; set; } = string.Empty;
    public string SlotType { get; set; } = string.Empty; // 'BOTTOM' or 'TOP'
    public double X { get; set; }
    public double Y { get; set; }

    public Well Well { get; set; } = null!;
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}
