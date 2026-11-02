using Xunit;
using Microsoft.EntityFrameworkCore;
using TLO.Api.Data;
using TLO.Api.Models;
using TLO.Api.Services;

namespace TLO.Tests;

public class OptimizationServiceTests
{
    private TloDbContext CreateContext(string name)
    {
        var options = new DbContextOptionsBuilder<TloDbContext>()
            .UseInMemoryDatabase(databaseName: name)
            .Options;
        var context = new TloDbContext(options);
        return context;
    }

    [Fact]
    public void Optimize_PlacesContainersWithinRules()
    {
        // Arrange
        using var context = CreateContext("TLO_Test_Optimize_1");

        context.Destinations.AddRange(
            new Destination { DestId = "MUM_101", Name = "Mumbai" },
            new Destination { DestId = "DEL_102", Name = "Delhi" }
        );
        context.Locomotives.AddRange(
            new Locomotive { LocoId = "LOC-0100", RailLine = 1, Orientation = "V", X = -4, Y = 2, Status = "Available", Destination = "Mumbai", DestId = "MUM_101" }
        );
        context.Railcars.AddRange(
            new Railcar { RailCarId = "RC-100", Type = "A", Weight = 95000, Status = "Available", Order = null, X = null, Y = null, Orientation = null, DestId = "MUM_101" }
        );
        context.Containers.AddRange(
            new Container { ContainerId = "CON-1001", SizeFt = 20, Weight = 8000, X = -3, Y = 3, YardTier = 0, ZoneId = "N-W", Priority = "Normal", Status = "Available", DestId = "MUM_101" },
            new Container { ContainerId = "CON-1002", SizeFt = 40, Weight = 22000, X = -3, Y = 3, YardTier = 1, ZoneId = "N-W", Priority = "High", Status = "Available", DestId = "MUM_101" }
        );
        context.SaveChanges();

        var service = new PlanService(context);

        // Act
        var plan = service.OptimizeAsync(new PlanRequest { DestId = "MUM_101", RailcarCount = 1 }, "test").Result;

        // Assert
        Assert.NotNull(plan);
        Assert.True(plan.Lines.Count > 0);
        Assert.True(plan.Kpis.SlotsFilled > 0);
    }

    [Fact]
    public void Optimize_OverLimitContainer_Rejected()
    {
        using var context = CreateContext("TLO_Test_OverLimit");

        context.Destinations.Add(new Destination { DestId = "MUM_101", Name = "Mumbai" });
        context.Locomotives.Add(new Locomotive { LocoId = "LOC-0100", RailLine = 1, Orientation = "V", X = -4, Y = 2, Status = "Available", Destination = "Mumbai", DestId = "MUM_101" });
        context.Railcars.Add(new Railcar { RailCarId = "RC-100", Type = "A", Weight = 95000, Status = "Available", Order = null, X = null, Y = null, Orientation = null, DestId = "MUM_101" });
        // 77000 lb container exceeds well weight limit of 70000 (R1)
        context.Containers.Add(new Container { ContainerId = "CON-1001", SizeFt = 40, Weight = 77000, X = -3, Y = 3, YardTier = 0, ZoneId = "N-W", Priority = "Normal", Status = "Available", DestId = "MUM_101" });
        context.SaveChanges();

        var service = new PlanService(context);

        var plan = service.OptimizeAsync(new PlanRequest { DestId = "MUM_101", RailcarCount = 1 }, "test").Result;

        // Container should be unassigned due to R1 (weight limit)
        Assert.Contains(plan.Unassigned, u => u.ContainerId == "CON-1001");
    }

    [Fact]
    public void Optimize_UnknownDestination_Throws()
    {
        using var context = CreateContext("TLO_Test_UnknownDest");

        var service = new PlanService(context);

        Assert.ThrowsAny<System.Exception>(() =>
            service.OptimizeAsync(new PlanRequest { DestId = "UNKNOWN", RailcarCount = 1 }, "test"));
    }
}
