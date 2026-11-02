import { Locomotive, Point, Railcar, Slot, Well } from '../types';

export const WELL_WEIGHT_LIMIT = 70000; // training value (handbook 1.4.4)
export const WELL_MAX_LENGTH = 40;
export const RAILCAR_LENGTHS: Record<'A' | 'B', number> = { A: 2, B: 4 }; // physical length along the line

export class PlanningError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** System picks eligible railcars (destination match + Available), ordered by ID (handbook 1.4.2). */
export function selectRailcars(all: Railcar[], destId: string, count: number): Railcar[] {
  if (!Number.isInteger(count) || count < 1) throw new PlanningError(400, 'Number of railcars must be 1 or more');
  const eligible = all.filter((r) => r.destId === destId && r.status === 'Available')
    .sort((a, b) => a.railCarId.localeCompare(b.railCarId));
  if (eligible.length < count)
    throw new PlanningError(400, `Only ${eligible.length} Available railcar(s) for ${destId}; you asked for ${count}`);
  return eligible.slice(0, count);
}

/** Order railcars behind the locomotive, extending along its line away from the origin.
 * Each railcar occupies its actual physical length (A=2, B=4 units) along the line,
 * packed tightly starting right behind the locomotive. The crane at (0,0) is the
 * measuring point; railcar coordinates are absolute yard positions derived from the
 * locomotive's position plus cumulative railcar lengths along its line direction. */
export function buildConsist(loco: Locomotive, railcars: Railcar[], destId: string): Railcar[] {
  if (loco.status !== 'Available') throw new PlanningError(400, `${loco.locoId} is not available`);
  if (railcars.length === 0) throw new PlanningError(400, 'Select at least one railcar');
  for (const rc of railcars) {
    if (rc.status === 'LOADED') throw new PlanningError(400, `${rc.railCarId} is already LOADED (R6)`);
    if (rc.destId !== destId) throw new PlanningError(400, `${rc.railCarId} destination does not match plan (R5)`);
  }
  const direction = loco.orientation === 'V' ? { x: 0, y: 1 } : { x: 1, y: 0 };
  const onLine = (p: Point) => loco.orientation === 'V' ? p.y : p.x;
  const withOnLine = (p: Point, v: number) => loco.orientation === 'V' ? { ...p, y: v } : { ...p, x: v };
  let cumulative = 0; // length along the line consumed by previous railcars
  return railcars.map((rc, i) => {
    const len = RAILCAR_LENGTHS[rc.type];
    const center = onLine(loco.coordinate) + cumulative + len / 2;
    const coordinate = withOnLine(loco.coordinate, center);
    cumulative += len;
    return { ...rc, order: i + 1, orientation: loco.orientation, coordinate };
  });
}

/** Type A = 1 well (2 slots stacked), Type B = 2 wells (4 slots: two stacks).
 * Slots stack perpendicular to the railcar's line direction around the railcar coordinate.
 * On a vertical line, slots spread horizontally (x offset). On a horizontal line, slots spread vertically (y offset). */
export function deriveWellsAndSlots(consist: Railcar[]): { wells: Well[]; slots: Slot[] } {
  const wells: Well[] = [];
  const slots: Slot[] = [];
  for (const rc of consist) {
    const vertical = rc.orientation === 'V';
    const perpOffset = vertical ? -0.4 : 0;   // x offset for vertical line, 0 for horizontal
    const paraOffset = vertical ? 0 : -0.4;   // y offset for horizontal line, 0 for vertical
    for (let w = 1; w <= (rc.type === 'A' ? 1 : 2); w++) {
      const wellId = `${rc.railCarId}-W${w}`;
      wells.push({ wellId, railCarId: rc.railCarId, maxLengthFt: WELL_MAX_LENGTH, weightLimit: WELL_WEIGHT_LIMIT });
      for (const slotType of ['BOTTOM', 'TOP'] as const) {
        const mult = slotType === 'BOTTOM' ? -1 : 1;
        const coordinate = rc.coordinate ? {
          x: rc.coordinate.x + perpOffset * mult,
          y: rc.coordinate.y + paraOffset * mult,
        } : rc.coordinate!;
        slots.push({ slotId: `${wellId}-${slotType}`, wellId, railCarId: rc.railCarId, slotType, coordinate });
      }
    }
  }
  return { wells, slots };
}
