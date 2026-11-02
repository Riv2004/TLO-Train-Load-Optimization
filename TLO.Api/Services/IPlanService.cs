using TLO.Api.Models;

namespace TLO.Api.Services;

public interface IPlanService
{
    Task<LoadPlan> OptimizeAsync(PlanRequest request, string createdBy);
    Task<LoadPlan> SavePlanAsync(LoadPlan plan, string createdBy);
    Task<List<LoadPlan>> GetAllPlansAsync();
    Task<LoadPlan?> GetPlanByIdAsync(int id);
}
