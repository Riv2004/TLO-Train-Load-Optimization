namespace TLO.Api.DTOs;

public class ContainerDto
{
    public string ContainerId { get; set; } = string.Empty;
    public int SizeFt { get; set; }
    public int Weight { get; set; }
    public double X { get; set; }
    public double Y { get; set; }
    public int YardTier { get; set; }
    public string ZoneId { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string DestId { get; set; } = string.Empty;
}

public class ContainerCreateRequest
{
    public string ContainerId { get; set; } = string.Empty;
    public int SizeFt { get; set; }
    public int Weight { get; set; }
    public double? X { get; set; }
    public double? Y { get; set; }
    public int YardTier { get; set; }
    public string ZoneId { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string DestId { get; set; } = string.Empty;
}
