"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planTrain = planTrain;
const optimizationEngine_1 = require("./optimizationEngine");
const planningInputService_1 = require("./planningInputService");
/**
 * Planner supplies destination + number of railcars. The system picks eligible railcars and,
 * unless a locomotive is named, tries every available locomotive and keeps the cheapest plan
 * (most containers placed first, then lowest average cost per container).
 */
function planTrain(store, req) {
    const dest = store.destinations.find((d) => d.destId === req.destId);
    if (!dest)
        throw new planningInputService_1.PlanningError(400, `Unknown destination ${req.destId}`);
    const railcars = (0, planningInputService_1.selectRailcars)(store.railcars, req.destId, Number(req.railcarCount));
    let locos = store.locomotives.filter((l) => l.status === 'Available');
    if (req.locoId) {
        const named = store.locomotives.find((l) => l.locoId === req.locoId);
        if (!named)
            throw new planningInputService_1.PlanningError(404, `Locomotive ${req.locoId} not found`);
        locos = [named];
    }
    if (locos.length === 0)
        throw new planningInputService_1.PlanningError(400, 'No locomotive is available');
    const trials = locos.map((l) => (0, optimizationEngine_1.optimize)(l, req.destId, railcars, store.containers))
        .sort((a, b) => b.lines.length - a.lines.length || a.kpis.avgCostPerContainer - b.kpis.avgCostPerContainer || a.locoId.localeCompare(b.locoId));
    const best = trials[0];
    best.destName = dest.name;
    best.locoCandidates = trials.map((t, i) => ({
        locoId: t.locoId, railLine: t.railLine, placed: t.lines.length, totalCost: t.kpis.totalCost,
        avgCost: t.kpis.avgCostPerContainer, chosen: i === 0,
    }));
    return best;
}
