namespace TLO.Api.Models;

public class Well
{
    public string WellId { get; set; } = string.Empty;
    public string RailCarId { get; set; } = string.Empty;
    public int MaxLengthFt { get; set; }
    public int WeightLimit { get; set; }

    public Railcar Railcar { get; set; } = null!;
    public ICollection<Slot> Slots { get; set; } = new List<Slot>();
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}
