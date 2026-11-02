using Microsoft.EntityFrameworkCore;
using TLO.Api.Models;

namespace TLO.Api.Data;

public class TloDbContext : DbContext
{
    public TloDbContext(DbContextOptions<TloDbContext> options) : base(options) { }

    public DbSet<Destination> Destinations { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Locomotive> Locomotives { get; set; } = null!;
    public DbSet<Railcar> Railcars { get; set; } = null!;
    public DbSet<Well> Wells { get; set; } = null!;
    public DbSet<Slot> Slots { get; set; } = null!;
    public DbSet<Container> Containers { get; set; } = null!;
    public DbSet<LoadPlan> LoadPlans { get; set; } = null!;
    public DbSet<Assignment> Assignments { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Destination
        modelBuilder.Entity<Destination>(e =>
        {
            e.HasKey(d => d.DestId);
            e.Property(d => d.Name).IsRequired().HasMaxLength(100);
            e.HasIndex(d => d.Name);
        });

        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Username);
            e.Property(u => u.Role).IsRequired().HasMaxLength(20);
            e.Property(u => u.Salt).IsRequired();
            e.Property(u => u.Hash).IsRequired();
            e.HasIndex(u => u.Role);
        });

        // Locomotive
        modelBuilder.Entity<Locomotive>(e =>
        {
            e.HasKey(l => l.LocoId);
            e.Property(l => l.RailLine).IsRequired();
            e.Property(l => l.Orientation).IsRequired().HasMaxLength(1);
            e.Property(l => l.Status).IsRequired().HasMaxLength(20);
            e.Property(l => l.Destination).IsRequired().HasMaxLength(100);
            e.Property(l => l.DestId).IsRequired().HasMaxLength(20);
            e.HasIndex(l => l.DestId);
            e.HasIndex(l => l.RailLine);
            e.HasOne(l => /* destination navigation not in model */ )
                .WithMany()
                .HasForeignKey(l => l.DestId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Railcar
        modelBuilder.Entity<Railcar>(e =>
        {
            e.HasKey(r => r.RailCarId);
            e.Property(r => r.Type).IsRequired().HasMaxLength(1);
            e.Property(r => r.Weight).IsRequired();
            e.Property(r => r.Status).IsRequired().HasMaxLength(20);
            e.Property(r => r.Order);
            e.Property(r => r.X);
            e.Property(r => r.Y);
            e.Property(r => r.Orientation).HasMaxLength(1);
            e.Property(r => r.DestId).IsRequired().HasMaxLength(20);
            e.HasIndex(r => r.DestId);
            e.HasIndex(r => r.Status);

            e.HasMany(r => r.Wells)
                .WithOne(w => w.Railcar!)
                .HasForeignKey(w => w.RailCarId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(r => r.Assignments)
                .WithOne(a => a.Railcar!)
                .HasForeignKey(a => a.RailCarId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Well
        modelBuilder.Entity<Well>(e =>
        {
            e.HasKey(w => w.WellId);
            e.Property(w => w.RailCarId).IsRequired().HasMaxLength(50);
            e.Property(w => w.MaxLengthFt).IsRequired();
            e.Property(w => w.WeightLimit).IsRequired();
            e.HasIndex(w => w.RailCarId);

            e.HasMany(w => w.Slots)
                .WithOne(s => s.Well!)
                .HasForeignKey(s => s.WellId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(w => w.Assignments)
                .WithOne(a => a.Well!)
                .HasForeignKey(a => a.WellId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Slot
        modelBuilder.Entity<Slot>(e =>
        {
            e.HasKey(s => s.SlotId);
            e.Property(s => s.WellId).IsRequired().HasMaxLength(50);
            e.Property(s => s.RailCarId).IsRequired().HasMaxLength(50);
            e.Property(s => s.SlotType).IsRequired().HasMaxLength(10);
            e.Property(s => s.X).IsRequired();
            e.Property(s => s.Y).IsRequired();
            e.HasIndex(s => s.WellId);
            e.HasIndex(s => s.RailCarId);

            e.HasMany(s => s.Assignments)
                .WithOne(a => a.Slot!)
                .HasForeignKey(a => a.SlotId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Container
        modelBuilder.Entity<Container>(e =>
        {
            e.HasKey(c => c.ContainerId);
            e.Property(c => c.SizeFt).IsRequired();
            e.Property(c => c.Weight).IsRequired();
            e.Property(c => c.X).IsRequired();
            e.Property(c => c.Y).IsRequired();
            e.Property(c => c.YardTier).IsRequired();
            e.Property(c => c.ZoneId).IsRequired().HasMaxLength(10);
            e.Property(c => c.Priority).IsRequired().HasMaxLength(20);
            e.Property(c => c.Status).IsRequired().HasMaxLength(20);
            e.Property(c => c.DestId).IsRequired().HasMaxLength(20);
            e.HasIndex(c => c.DestId);
            e.HasIndex(c => c.Status);

            e.HasMany(c => c.Assignments)
                .WithOne(a => a.Container!)
                .HasForeignKey(a => a.ContainerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // LoadPlan
        modelBuilder.Entity<LoadPlan>(e =>
        {
            e.HasKey(p => p.PlanId);
            e.Property(p => p.CreatedAt).IsRequired();
            e.Property(p => p.CreatedBy).IsRequired().HasMaxLength(100);
            e.Property(p => p.DestId).IsRequired().HasMaxLength(20);
            e.Property(p => p.DestName).IsRequired().HasMaxLength(100);
            e.Property(p => p.LocoId).IsRequired().HasMaxLength(50);
            e.Property(p => p.RailLine).IsRequired();
            e.Property(p => p.Kpis).HasColumnType("nvarchar(max)");
            e.Property(p => p.Unassigned).HasColumnType("nvarchar(max)");
            e.Property(p => p.LocoCandidates).HasColumnType("nvarchar(max)");
            e.HasIndex(p => p.DestId);
            e.HasIndex(p => p.CreatedAt);

            e.HasOne(p => p.Locomotive)
                .WithMany(l => l.Plans)
                .HasForeignKey(p => p.LocoId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Assignment
        modelBuilder.Entity<Assignment>(e =>
        {
            e.HasKey(a => a.AssignmentId);
            e.Property(a => a.PlanId).IsRequired();
            e.Property(a => a.LineNo).IsRequired();
            e.Property(a => a.ContainerId).IsRequired().HasMaxLength(50);
            e.Property(a => a.RailCarId).IsRequired().HasMaxLength(50);
            e.Property(a => a.WellId).IsRequired().HasMaxLength(50);
            e.Property(a => a.SlotId).IsRequired().HasMaxLength(50);
            e.Property(a => a.SlotType).IsRequired().HasMaxLength(10);
            e.Property(a => a.RailLine).IsRequired();
            e.Property(a => a.Score).IsRequired();
            e.Property(a => a.Travel).IsRequired();
            e.Property(a => a.Dig).IsRequired();
            e.Property(a => a.Reposition).IsRequired();
            e.Property(a => a.Zone).IsRequired();
            e.Property(a => a.Cost).IsRequired();
            e.Property(a => a.Lifts).IsRequired();
            e.HasIndex(a => a.PlanId);
            e.HasIndex(a => a.ContainerId);

            e.HasOne(a => a.Plan)
                .WithMany(p => p.Assignments)
                .HasForeignKey(a => a.PlanId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
