using TLO.Api.DTOs;
using TLO.Api.Models;

namespace TLO.Api.Business;

public interface IOptimizationService
{
    Task<LoadPlan> OptimizeAsync(PlanRequest request, string createdBy);
    Task<LoadPlan> SavePlanAsync(LoadPlan plan, string createdBy);
    Task<List<LoadPlan>> GetAllPlansAsync();
    Task<LoadPlan?> GetPlanByIdAsync(int id);
}
