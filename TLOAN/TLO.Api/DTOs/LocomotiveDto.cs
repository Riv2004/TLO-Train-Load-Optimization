namespace TLO.Api.DTOs;

public class LocomotiveDto
{
    public string LocoId { get; set; } = string.Empty;
    public int RailLine { get; set; }
    public string Orientation { get; set; } = string.Empty;
    public double X { get; set; }
    public double Y { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public string DestId { get; set; } = string.Empty;
}

public class LocomotiveCreateRequest
{
    public string LocoId { get; set; } = string.Empty;
    public int RailLine { get; set; }
    public string Orientation { get; set; } = string.Empty;
    public double X { get; set; }
    public double Y { get; set; }
    public string Status { get; set; } = string.Empty;
    public string DestId { get; set; } = string.Empty;
}
