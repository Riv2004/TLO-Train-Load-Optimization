import { Container, Railcar, Slot, Well } from '../types';

// Hard rules R1-R7 (handbook 1.9). Each is a pure Boolean gate:
// if any fails, the container-slot pair is NOT a candidate (no partial credit).

export interface RuleContext {
  container: Container;
  railcar: Railcar;
  well: Well;
  slot: Slot;
  planDestId: string;
  filledSlotIds: Set<string>;          // slots already assigned in this plan
  railcarLoadedWeight: number;         // weight already placed on this railcar
  wellLoadedWeight: number;            // weight already placed in this well
}

export interface RuleResult { ok: boolean; rule?: string; message?: string }

const fail = (rule: string, message: string): RuleResult => ({ ok: false, rule, message });

export function checkRules(c: RuleContext): RuleResult {
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
