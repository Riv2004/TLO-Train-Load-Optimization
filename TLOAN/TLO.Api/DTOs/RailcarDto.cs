namespace TLO.Api.DTOs;

public class RailcarDto
{
    public string RailCarId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Weight { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? Order { get; set; }
    public double? X { get; set; }
    public double? Y { get; set; }
    public string? Orientation { get; set; }
    public string DestId { get; set; } = string.Empty;
}

public class RailcarCreateRequest
{
    public string RailCarId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Weight { get; set; }
    public string Status { get; set; } = string.Empty;
    public string DestId { get; set; } = string.Empty;
}
