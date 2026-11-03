import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { checkPassword, clearSessions, endSession, requireAuth, requireRole, startSession } from './auth';
import { ZONES } from './data/seed';
import { store } from './store';
import { buildDashboard } from './services/dashboard';
import { planTrain } from './services/planner';
import { PlanningError } from './services/planningInputService';
import { Container, Locomotive, Railcar, ZoneId } from './types';

export const app = express();
app.use(cors());
app.use(express.json());

const bad = (msg: string) => new PlanningError(400, msg);
const num = (v: unknown, name: string) => { const n = Number(v); if (!Number.isFinite(n)) throw bad(`${name} must be a number`); return n; };
const need = (v: unknown, name: string) => { if (!v || typeof v !== 'string') throw bad(`${name} is required`); return v.trim(); };
const destOf = (id: unknown) => {
  const d = store.destinations.find((x) => x.destId === id);
  if (!d) throw bad(`Unknown destination ${id}`);
  return d;
};

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ---- auth ----
app.post('/api/auth/login', (req, res) => {
  const user = store.users.find((u) => u.username === req.body?.username);
  if (!user || !checkPassword(user, String(req.body?.password ?? ''))) return res.status(401).json({ error: 'Wrong username or password' });
  res.json({ token: startSession(user), user: { username: user.username, role: user.role } });
});
app.post('/api/auth/logout', requireAuth, (req, res) => { endSession((req as any).token); res.json({ ok: true }); });
app.get('/api/auth/me', requireAuth, (req, res) => { const u = (req as any).user; res.json({ username: u.username, role: u.role }); });

app.use('/api', requireAuth);
const admin = requireRole('admin');

// ---- read master data (any signed-in user) ----
app.get('/api/destinations', (_req, res) => res.json(store.destinations));
app.get('/api/locomotives', (_req, res) => res.json(store.locomotives));
app.get('/api/railcars', (req, res) => {
  const { destId } = req.query;
  res.json(store.railcars.filter((r) => !destId || r.destId === destId));
});
app.get('/api/containers', (req, res) => {
  const { destId } = req.query;
  res.json(store.containers.filter((c) => !destId || c.destId === destId));
});

// ---- administrator: master data CRUD ----
const normalizers = {
  locomotives: (b: any, id?: string): Locomotive => {
    const railLine = num(b.railLine, 'railLine');
    if (railLine < 1 || railLine > 9 || !Number.isInteger(railLine)) throw bad('railLine must be a whole number from 1 to 9');
    const d = destOf(b.destId);
    const orientation = b.orientation === 'H' ? 'H' : 'V';
    return { locoId: id ?? need(b.locoId, 'locoId'), railLine, orientation, coordinate: { x: num(b.x, 'x'), y: num(b.y, 'y') },
      status: b.status === 'Not Available' ? 'Not Available' : 'Available', destination: d.name, destId: d.destId };
  },
  railcars: (b: any, id?: string): Railcar => {
    if (b.type !== 'A' && b.type !== 'B') throw bad('type must be A or B');
    const weight = num(b.weight, 'weight'); if (weight <= 0) throw bad('weight must be above 0');
    return { railCarId: id ?? need(b.railCarId, 'railCarId'), type: b.type, weight, status: b.status === 'LOADED' ? 'LOADED' : 'Available',
      order: null, coordinate: null, orientation: null, destId: destOf(b.destId).destId };
  },
  containers: (b: any, id?: string): Container => {
    const sizeFt = num(b.sizeFt, 'sizeFt'); if (sizeFt !== 20 && sizeFt !== 40) throw bad('sizeFt must be 20 or 40');
    const weight = num(b.weight, 'weight'); if (weight <= 0) throw bad('weight must be above 0');
    const yardTier = num(b.yardTier ?? 0, 'yardTier'); if (yardTier < 0 || !Number.isInteger(yardTier)) throw bad('yardTier must be 0 or more');
    if (!(b.zoneId in ZONES)) throw bad('zoneId must be N-W, S-W, S-E or N-E');
    if (!['Critical', 'High', 'Normal'].includes(b.priority)) throw bad('priority must be Critical, High or Normal');
    return { containerId: id ?? need(b.containerId, 'containerId'), sizeFt, weight, yardTier, zoneId: b.zoneId as ZoneId, priority: b.priority,
      coordinate: { x: num(b.x ?? ZONES[b.zoneId as ZoneId].x, 'x'), y: num(b.y ?? ZONES[b.zoneId as ZoneId].y, 'y') },
      status: b.status === 'ASSIGNED' ? 'ASSIGNED' : 'Available', destId: destOf(b.destId).destId };
  },
};
function crud<K extends keyof typeof normalizers>(path: K, list: () => any[], key: string) {
  const find = (id: string) => list().findIndex((x) => x[key] === id);
  app.post(`/api/${path}`, admin, (req, res) => {
    const item = normalizers[path](req.body);
    if (find((item as any)[key]) >= 0) throw bad(`${(item as any)[key]} already exists`);
    list().push(item); res.status(201).json(item);
  });
  app.put(`/api/${path}/:id`, admin, (req, res) => {
    const i = find(req.params.id); if (i < 0) throw new PlanningError(404, `${req.params.id} not found`);
    const item = normalizers[path]({ ...req.body }, req.params.id); list()[i] = item; res.json(item);
  });
  app.delete(`/api/${path}/:id`, admin, (req, res) => {
    const i = find(req.params.id); if (i < 0) throw new PlanningError(404, `${req.params.id} not found`);
    list().splice(i, 1); res.json({ ok: true });
  });
}
crud('locomotives', () => store.locomotives, 'locoId');
crud('railcars', () => store.railcars, 'railCarId');
crud('containers', () => store.containers, 'containerId');
app.get('/api/users', admin, (_req, res) => res.json(store.users.map((u) => ({ username: u.username, role: u.role }))));
app.post('/api/reset', admin, (_req, res) => { store.reset(); clearSessions(); res.json({ ok: true }); });

// ---- planning (planner or administrator) ----
// Body: { destId, railcarCount, locoId? } - leave locoId out to let the system pick the cheapest locomotive.
app.post('/api/plans/optimize', (req, res) => res.json(planTrain(store, req.body ?? {})));
app.post('/api/plans', (req, res) => {
  const plan = planTrain(store, req.body ?? {}); // re-run server-side so clients cannot submit tampered plans
  res.status(201).json(store.savePlan(plan, (req as any).user.username));
});
app.get('/api/plans', (_req, res) => res.json(store.plans.map(({ lines, consist, unassigned, locoCandidates, ...head }) => head)));
app.get('/api/plans/:id', (req, res) => {
  const plan = store.plans.find((p) => p.planId === Number(req.params.id));
  if (!plan) throw new PlanningError(404, 'Plan not found');
  res.json(plan);
});
app.get('/api/dashboard', (_req, res) => res.json(buildDashboard(store)));

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err instanceof PlanningError ? err.status : 500).json({ error: err.message ?? 'Server error' });
});
