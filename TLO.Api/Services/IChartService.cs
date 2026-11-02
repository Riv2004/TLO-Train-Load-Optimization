namespace TLO.Api.Services;

public interface IChartService
{
    object GetSlotUtilizationChart();
    object GetCostByDestinationChart();
    object GetPenaltyBreakdownChart();
}
