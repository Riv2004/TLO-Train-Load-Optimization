using Microsoft.EntityFrameworkCore;
using TLO.Api.Models;

namespace TLO.Api.Data;

public static class SeedDatabase
{
    public static async Task SeedAsync(TloDbContext context)
    {
        await context.Database.MigrateAsync();

        // Destinations
        if (!context.Destinations.Any())
        {
            context.Destinations.AddRange(new[]
            {
                new Destination { DestId = "MUM_101", Name = "Mumbai" },
                new Destination { DestId = "DEL_102", Name = "Delhi" },
                new Destination { DestId = "KOL_103", Name = "Kolkata" },
                new Destination { DestId = "MAA_104", Name = "Chennai" },
                new Destination { DestId = "BLR_105", Name = "Bengaluru" },
            });
            await context.SaveChangesAsync();
        }

        // Users (admin + planner)
        if (!context.Users.Any())
        {
            var adminSalt = BCrypt.Net.BCrypt.GenerateSalt();
            var plannerSalt = BCrypt.Net.BCrypt.GenerateSalt();

            context.Users.AddRange(new[]
            {
                new User
                {
                    Username = "admin",
                    Role = "admin",
                    Salt = adminSalt,
                    Hash = BCrypt.Net.BCrypt.HashPassword("admin123", adminSalt)
                },
                new User
                {
                    Username = "planner",
                    Role = "planner",
                    Salt = plannerSalt,
                    Hash = BCrypt.Net.BCrypt.HashPassword("planner123", plannerSalt)
                }
            });
            await context.SaveChangesAsync();
        }

        // Locomotives (9 orthogonal lines: 1-5 vertical at x=-4..1, 6-9 horizontal at y=-4..-1)
        if (!context.Locomotives.Any())
        {
            context.Locomotives.AddRange(new[]
            {
                new Locomotive { LocoId = "LOC-0100", RailLine = 1, Orientation = "V", X = -4, Y = 2, Status = "Available", Destination = "Mumbai", DestId = "MUM_101" },
                new Locomotive { LocoId = "LOC-0200", RailLine = 2, Orientation = "V", X = -3, Y = 2, Status = "Available", Destination = "Delhi", DestId = "DEL_102" },
                new Locomotive { LocoId = "LOC-0300", RailLine = 3, Orientation = "V", X = -2, Y = 2, Status = "Available", Destination = "Kolkata", DestId = "KOL_103" },
                new Locomotive { LocoId = "LOC-0400", RailLine = 4, Orientation = "V", X = -1, Y = 2, Status = "Not Available", Destination = "Mumbai", DestId = "MUM_101" },
                new Locomotive { LocoId = "LOC-0500", RailLine = 5, Orientation = "V", X = 1, Y = 2, Status = "Available", Destination = "Chennai", DestId = "MAA_104" },
                new Locomotive { LocoId = "LOC-0600", RailLine = 6, Orientation = "H", X = 2, Y = -4, Status = "Available", Destination = "Bengaluru", DestId = "BLR_105" },
                new Locomotive { LocoId = "LOC-0700", RailLine = 7, Orientation = "H", X = 2, Y = -3, Status = "Available", Destination = "Mumbai", DestId = "MUM_101" },
                new Locomotive { LocoId = "LOC-0800", RailLine = 8, Orientation = "H", X = 2, Y = -2, Status = "Not Available", Destination = "Delhi", DestId = "DEL_102" },
                new Locomotive { LocoId = "LOC-0900", RailLine = 9, Orientation = "H", X = 2, Y = -1, Status = "Available", Destination = "Kolkata", DestId = "KOL_103" },
            });
            await context.SaveChangesAsync();
        }

        // Railcars (5 per destination = 25 total)
        if (!context.Railcars.Any())
        {
            var railcars = new List<Railcar>();
            foreach (var dest in context.Destinations.ToList())
            {
                var types = new[] { "A", "B", "B", "A", "B" };
                for (int i = 0; i < 5; i++)
                {
                    var isLoaded = (i == 4 && (dest.DestId == "MUM_101" || dest.DestId == "MAA_104"));
                    railcars.Add(new Railcar
                    {
                        RailCarId = $"RC-{(int.Parse(dest.DestId.Substring(3)) * 100) + i}",
                        Type = types[i],
                        Weight = types[i] == "A" ? 95000 : 190000,
                        Status = isLoaded ? "LOADED" : "Available",
                        Order = null,
                        X = null,
                        Y = null,
                        Orientation = null,
                        DestId = dest.DestId
                    });
                }
            }
            context.Railcars.AddRange(railcars);
            await context.SaveChangesAsync();
        }

        // Containers (16 per destination = 80 total)
        if (!context.Containers.Any())
        {
            var rng = new Random(2026);
            var zoneIds = new[] { "N-W", "S-W", "S-E", "N-E" };
            var containers = new List<Container>();

            foreach (var dest in context.Destinations.ToList())
            {
                for (int i = 0; i < 16; i++)
                {
                    var sizeFt = rng.NextDouble() < 0.55 ? 40 : 20;
                    var zoneId = zoneIds[rng.Next(4)];
                    var p = rng.NextDouble();
                    var t = rng.NextDouble();
                    var heavy = (i == 15);
                    var weight = heavy ? 77000 : Math.Round((sizeFt == 40 ? 18000 + rng.NextDouble() * 16000 : 8000 + rng.NextDouble() * 10000) / 100.0) * 100;

                    var zoneOffset = zoneId switch
                    {
                        "N-W" => (x: -3.0, y: 3.0),
                        "S-W" => (x: -3.0, y: -4.0),
                        "S-E" => (x: 5.0, y: -3.0),
                        _ => (x: 2.0, y: 2.0)
                    };

                    containers.Add(new Container
                    {
                        ContainerId = $"CON-{(int.Parse(dest.DestId.Substring(3)) * 1000) + i + 1}",
                        SizeFt = sizeFt,
                        Weight = (int)weight,
                        X = Math.Round(zoneOffset.x + (rng.NextDouble() - 0.5) * 3, 1),
                        Y = Math.Round(zoneOffset.y + (rng.NextDouble() - 0.5) * 3, 1),
                        YardTier = t < 0.55 ? 0 : t < 0.8 ? 1 : 2,
                        ZoneId = zoneId,
                        Priority = p < 0.15 ? "Critical" : p < 0.45 ? "High" : "Normal",
                        Status = "Available",
                        DestId = dest.DestId
                    });
                }
            }
            context.Containers.AddRange(containers);
            await context.SaveChangesAsync();
        }
    }
}
