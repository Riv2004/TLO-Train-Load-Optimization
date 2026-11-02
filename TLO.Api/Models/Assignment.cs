namespace TLO.Api.Models;

public class Assignment
{
    public string AssignmentId { get; set; } = string.Empty;
    public int PlanId { get; set; }
    public int LineNo { get; set; }
    public string ContainerId { get; set; } = string.Empty;
    public string RailCarId { get; set; } = string.Empty;
    public string WellId { get; set; } = string.Empty;
    public string SlotId { get; set; } = string.Empty;
    public string SlotType { get; set; } = string.Empty;
    public int RailLine { get; set; }
    public double Score { get; set; }
    public double Travel { get; set; }
    public double Dig { get; set; }
    public double Reposition { get; set; }
    public double Zone { get; set; }
    public double Cost { get; set; }
    public int Lifts { get; set; }

    public LoadPlan Plan { get; set; } = null!;
    public Container Container { get; set; } = null!;
    public Railcar Railcar { get; set; } = null!;
    public Well Well { get; set; } = null!;
    public Slot Slot { get; set; } = null!;
}
