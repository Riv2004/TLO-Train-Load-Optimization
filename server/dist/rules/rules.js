"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRules = checkRules;
const fail = (rule, message) => ({ ok: false, rule, message });
function checkRules(c) {
    // R1 - well weight limit (single container)
    if (c.container.weight > c.well.weightLimit)
        return fail('R1', `${c.container.weight} lb exceeds well limit ${c.well.weightLimit} lb`);
    // R2 - length fit
    if (c.container.sizeFt > c.well.maxLengthFt)
        return fail('R2', `${c.container.sizeFt} ft container does not fit ${c.well.maxLengthFt} ft well`);
    // R3 - bottom before top
    if (c.slot.slotType === 'TOP' && !c.filledSlotIds.has(`${c.well.wellId}-BOTTOM`))
        return fail('R3', 'TOP slot needs the BOTTOM slot in the same well filled first');
    // R4 - container availability
    if (c.container.status !== 'Available')
        return fail('R4', 'Container is not Available');
    // R5 - destination match
    if (c.railcar.destId !== c.planDestId || c.container.destId !== c.planDestId)
        return fail('R5', 'Destination does not match the plan');
    // R6 - railcar status
    if (c.railcar.status !== 'Available')
        return fail('R6', 'Railcar is already LOADED');
    // R7 - combined weight limits (well and railcar total)
    if (c.wellLoadedWeight + c.container.weight > c.well.weightLimit * 2)
        return fail('R7', 'Combined well weight exceeded');
    if (c.railcarLoadedWeight + c.container.weight > c.railcar.weight)
        return fail('R7', 'Railcar total weight limit exceeded');
    return { ok: true };
}
