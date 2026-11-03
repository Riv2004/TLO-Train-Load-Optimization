import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from './app';
import { store } from './store';
import { clearSessions } from './auth';
import { checkRules } from './rules/rules';
import { moveCost, optimize } from './services/optimizationEngine';
import { planTrain } from './services/planner';
import { seedContainers, seedLocomotives, seedRailcars } from './data/seed';

beforeEach(() => { store.reset(); clearSessions(); });

const login = async (username: string, password: string) =>
  (await request(app).post('/api/auth/login').send({ username, password })).body.token as string;
const asPlanner = async () => ({ Authorization: `Bearer ${await login('planner', 'planner123')}` });
const asAdmin = async () => ({ Authorization: `Bearer ${await login('admin', 'admin123')}` });

describe('yard setup', () => {
  it('has 9 rail lines, 5 destinations, and both railcar types', () => {
    expect(seedLocomotives().map((l) => l.railLine)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(store.destinations).toHaveLength(5);
    expect(new Set(seedRailcars().map((r) => r.type))).toEqual(new Set(['A', 'B']));
  });
});

describe('hard rules', () => {
  const base = () => {
    const container = seedContainers().find((c) => c.destId === 'MUM_101' && c.weight < 70000)!;
    const railcar = seedRailcars()[0];
    const well = { wellId: 'RC-100-W1', railCarId: 'RC-100', maxLengthFt: 40, weightLimit: 70000 };
    const slot = { slotId: 'RC-100-W1-BOTTOM', wellId: 'RC-100-W1', railCarId: 'RC-100', slotType: 'BOTTOM' as const, coordinate: { x: 3, y: 3 } };
    return { container, railcar, well, slot, planDestId: 'MUM_101', filledSlotIds: new Set<string>(), railcarLoadedWeight: 0, wellLoadedWeight: 0 };
  };
  it('passes a valid pair', () => expect(checkRules(base()).ok).toBe(true));
  it('R1 over-weight', () => { const c = base(); c.container = { ...c.container, weight: 77000 }; expect(checkRules(c).rule).toBe('R1'); });
  it('R2 too long', () => { const c = base(); c.well = { ...c.well, maxLengthFt: 20 }; c.container = { ...c.container, sizeFt: 40 }; expect(checkRules(c).rule).toBe('R2'); });
  it('R3 TOP before BOTTOM', () => { const c = base(); c.slot = { ...c.slot, slotId: 'RC-100-W1-TOP', slotType: 'TOP' }; expect(checkRules(c).rule).toBe('R3'); });
  it('R5 wrong destination', () => { const c = base(); c.planDestId = 'DEL_102'; expect(checkRules(c).rule).toBe('R5'); });
  it('R6 loaded railcar', () => { const c = base(); c.railcar = { ...c.railcar, status: 'LOADED' }; expect(checkRules(c).rule).toBe('R6'); });
});

describe('cost model and optimizer', () => {
  const c0 = seedContainers()[0];
  const slot = { slotId: 's', wellId: 'w', railCarId: 'r', slotType: 'BOTTOM' as const, coordinate: { x: 4, y: 0 } };
  it('penalises buried containers', () => {
    const none = moveCost({ ...c0, yardTier: 0 }, slot, { slotPos: null, zoneId: null });
    const buried = moveCost({ ...c0, yardTier: 2 }, slot, { slotPos: null, zoneId: null });
    expect(buried.total - none.total).toBeCloseTo(12);
  });
  it('penalises re-aiming between railcars and hopping zones', () => {
    const same = moveCost({ ...c0, zoneId: 'N-E' }, slot, { slotPos: { x: 4, y: 0 }, zoneId: 'N-E' });
    const moved = moveCost({ ...c0, zoneId: 'N-E' }, slot, { slotPos: { x: 7, y: 0 }, zoneId: 'S-W' });
    expect(same.reposition + same.zone).toBe(0);
    expect(moved.reposition).toBe(6);
    expect(moved.zone).toBe(3);
  });
  const run = () => optimize(seedLocomotives()[4], 'MUM_101',
    seedRailcars().filter((r) => r.destId === 'MUM_101' && r.status === 'Available').slice(0, 3), seedContainers());
  it('never breaks a rule, keeps TOP above BOTTOM, rejects the overweight container', () => {
    const plan = run();
    expect(plan.lines.length).toBeGreaterThan(0);
    expect(plan.unassigned.map((u) => u.containerId)).toContain('CON-1016');
    for (const l of plan.lines.filter((x) => x.slotType === 'TOP'))
      expect(plan.lines.some((b) => b.slotId === l.slotId.replace('TOP', 'BOTTOM'))).toBe(true);
  });
  it('is deterministic and its KPIs add up', () => {
    const a = run();
    expect(a).toEqual(run());
    expect(a.kpis.totalCost).toBeCloseTo(a.kpis.craneTravel + a.kpis.penalty.total, 1);
    expect(a.kpis.slotsFilled).toBe(a.lines.length);
  });
  it('auto-picks the locomotive with the lowest cost', () => {
    const plan = planTrain(store, { destId: 'MUM_101', railcarCount: 3 });
    const chosen = plan.locoCandidates!.find((c) => c.chosen)!;
    for (const other of plan.locoCandidates!)
      if (other.placed === chosen.placed) expect(chosen.avgCost).toBeLessThanOrEqual(other.avgCost + 0.01);
    expect(plan.locoCandidates!.every((c) => c.locoId !== 'LOC-040' && c.locoId !== 'LOC-080')).toBe(true); // unavailable
  });
});

describe('API and roles', () => {
  it('requires sign-in', async () => expect((await request(app).get('/api/locomotives')).status).toBe(401));
  it('rejects a wrong password', async () =>
    expect((await request(app).post('/api/auth/login').send({ username: 'admin', password: 'nope' })).status).toBe(401));
  it('planner cannot change master data; admin can', async () => {
    const body = { containerId: 'CON-9999', sizeFt: 20, weight: 9000, zoneId: 'N-E', priority: 'Normal', destId: 'DEL_102' };
    expect((await request(app).post('/api/containers').set(await asPlanner()).send(body)).status).toBe(403);
    expect((await request(app).post('/api/containers').set(await asAdmin()).send(body)).status).toBe(201);
    expect((await request(app).post('/api/containers').set(await asAdmin()).send(body)).status).toBe(400); // duplicate
    expect((await request(app).delete('/api/containers/CON-9999').set(await asAdmin())).status).toBe(200);
  });
  it('rejects asking for more railcars than are available', async () => {
    const res = await request(app).post('/api/plans/optimize').set(await asPlanner()).send({ destId: 'MUM_101', railcarCount: 9 });
    expect(res.status).toBe(400);
  });
  it('saves a plan, marks railcars LOADED, and feeds the dashboard', async () => {
    const h = await asPlanner();
    const saved = await request(app).post('/api/plans').set(h).send({ destId: 'DEL_102', railcarCount: 2 });
    expect(saved.status).toBe(201);
    expect(saved.body.createdBy).toBe('planner');
    expect(store.railcars.filter((r) => r.destId === 'DEL_102' && r.status === 'LOADED').length).toBeGreaterThanOrEqual(2);
    const dash = (await request(app).get('/api/dashboard').set(h)).body;
    expect(dash.totals.plans).toBe(1);
    expect(dash.totals.containersLoaded).toBe(saved.body.lines.length);
    expect(dash.byDestination).toHaveLength(5);
  });
});
