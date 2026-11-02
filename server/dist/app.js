"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const auth_1 = require("./auth");
const seed_1 = require("./data/seed");
const store_1 = require("./store");
const dashboard_1 = require("./services/dashboard");
const planner_1 = require("./services/planner");
const planningInputService_1 = require("./services/planningInputService");
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)());
exports.app.use(express_1.default.json());
const bad = (msg) => new planningInputService_1.PlanningError(400, msg);
const num = (v, name) => { const n = Number(v); if (!Number.isFinite(n))
    throw bad(`${name} must be a number`); return n; };
const need = (v, name) => { if (!v || typeof v !== 'string')
    throw bad(`${name} is required`); return v.trim(); };
const destOf = (id) => {
    const d = store_1.store.destinations.find((x) => x.destId === id);
    if (!d)
        throw bad(`Unknown destination ${id}`);
    return d;
};
exports.app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
// ---- auth ----
exports.app.post('/api/auth/login', (req, res) => {
    const user = store_1.store.users.find((u) => u.username === req.body?.username);
    if (!user || !(0, auth_1.checkPassword)(user, String(req.body?.password ?? '')))
        return res.status(401).json({ error: 'Wrong username or password' });
    res.json({ token: (0, auth_1.startSession)(user), user: { username: user.username, role: user.role } });
});
exports.app.post('/api/auth/logout', auth_1.requireAuth, (req, res) => { (0, auth_1.endSession)(req.token); res.json({ ok: true }); });
exports.app.get('/api/auth/me', auth_1.requireAuth, (req, res) => { const u = req.user; res.json({ username: u.username, role: u.role }); });
exports.app.use('/api', auth_1.requireAuth);
const admin = (0, auth_1.requireRole)('admin');
// ---- read master data (any signed-in user) ----
exports.app.get('/api/destinations', (_req, res) => res.json(store_1.store.destinations));
exports.app.get('/api/locomotives', (_req, res) => res.json(store_1.store.locomotives));
exports.app.get('/api/railcars', (req, res) => {
    const { destId } = req.query;
    res.json(store_1.store.railcars.filter((r) => !destId || r.destId === destId));
});
exports.app.get('/api/containers', (req, res) => {
    const { destId } = req.query;
    res.json(store_1.store.containers.filter((c) => !destId || c.destId === destId));
});
// ---- administrator: master data CRUD ----
const normalizers = {
    locomotives: (b, id) => {
        const railLine = num(b.railLine, 'railLine');
        if (railLine < 1 || railLine > 9 || !Number.isInteger(railLine))
            throw bad('railLine must be a whole number from 1 to 9');
        const d = destOf(b.destId);
        const orientation = b.orientation === 'H' ? 'H' : 'V';
        return { locoId: id ?? need(b.locoId, 'locoId'), railLine, orientation, coordinate: { x: num(b.x, 'x'), y: num(b.y, 'y') },
            status: b.status === 'Not Available' ? 'Not Available' : 'Available', destination: d.name, destId: d.destId };
    },
    railcars: (b, id) => {
        if (b.type !== 'A' && b.type !== 'B')
            throw bad('type must be A or B');
        const weight = num(b.weight, 'weight');
        if (weight <= 0)
            throw bad('weight must be above 0');
        return { railCarId: id ?? need(b.railCarId, 'railCarId'), type: b.type, weight, status: b.status === 'LOADED' ? 'LOADED' : 'Available',
            order: null, coordinate: null, orientation: null, destId: destOf(b.destId).destId };
    },
    containers: (b, id) => {
        const sizeFt = num(b.sizeFt, 'sizeFt');
        if (sizeFt !== 20 && sizeFt !== 40)
            throw bad('sizeFt must be 20 or 40');
        const weight = num(b.weight, 'weight');
        if (weight <= 0)
            throw bad('weight must be above 0');
        const yardTier = num(b.yardTier ?? 0, 'yardTier');
        if (yardTier < 0 || !Number.isInteger(yardTier))
            throw bad('yardTier must be 0 or more');
        if (!(b.zoneId in seed_1.ZONES))
            throw bad('zoneId must be N-W, S-W, S-E or N-E');
        if (!['Critical', 'High', 'Normal'].includes(b.priority))
            throw bad('priority must be Critical, High or Normal');
        return { containerId: id ?? need(b.containerId, 'containerId'), sizeFt, weight, yardTier, zoneId: b.zoneId, priority: b.priority,
            coordinate: { x: num(b.x ?? seed_1.ZONES[b.zoneId].x, 'x'), y: num(b.y ?? seed_1.ZONES[b.zoneId].y, 'y') },
            status: b.status === 'ASSIGNED' ? 'ASSIGNED' : 'Available', destId: destOf(b.destId).destId };
    },
};
function crud(path, list, key) {
    const find = (id) => list().findIndex((x) => x[key] === id);
    exports.app.post(`/api/${path}`, admin, (req, res) => {
        const item = normalizers[path](req.body);
        if (find(item[key]) >= 0)
            throw bad(`${item[key]} already exists`);
        list().push(item);
        res.status(201).json(item);
    });
    exports.app.put(`/api/${path}/:id`, admin, (req, res) => {
        const i = find(req.params.id);
        if (i < 0)
            throw new planningInputService_1.PlanningError(404, `${req.params.id} not found`);
        const item = normalizers[path]({ ...req.body }, req.params.id);
        list()[i] = item;
        res.json(item);
    });
    exports.app.delete(`/api/${path}/:id`, admin, (req, res) => {
        const i = find(req.params.id);
        if (i < 0)
            throw new planningInputService_1.PlanningError(404, `${req.params.id} not found`);
        list().splice(i, 1);
        res.json({ ok: true });
    });
}
crud('locomotives', () => store_1.store.locomotives, 'locoId');
crud('railcars', () => store_1.store.railcars, 'railCarId');
crud('containers', () => store_1.store.containers, 'containerId');
exports.app.get('/api/users', admin, (_req, res) => res.json(store_1.store.users.map((u) => ({ username: u.username, role: u.role }))));
exports.app.post('/api/reset', admin, (_req, res) => { store_1.store.reset(); (0, auth_1.clearSessions)(); res.json({ ok: true }); });
// ---- planning (planner or administrator) ----
// Body: { destId, railcarCount, locoId? } - leave locoId out to let the system pick the cheapest locomotive.
exports.app.post('/api/plans/optimize', (req, res) => res.json((0, planner_1.planTrain)(store_1.store, req.body ?? {})));
exports.app.post('/api/plans', (req, res) => {
    const plan = (0, planner_1.planTrain)(store_1.store, req.body ?? {}); // re-run server-side so clients cannot submit tampered plans
    res.status(201).json(store_1.store.savePlan(plan, req.user.username));
});
exports.app.get('/api/plans', (_req, res) => res.json(store_1.store.plans.map(({ lines, consist, unassigned, locoCandidates, ...head }) => head)));
exports.app.get('/api/plans/:id', (req, res) => {
    const plan = store_1.store.plans.find((p) => p.planId === Number(req.params.id));
    if (!plan)
        throw new planningInputService_1.PlanningError(404, 'Plan not found');
    res.json(plan);
});
exports.app.get('/api/dashboard', (_req, res) => res.json((0, dashboard_1.buildDashboard)(store_1.store)));
exports.app.use((err, _req, res, _next) => {
    res.status(err instanceof planningInputService_1.PlanningError ? err.status : 500).json({ error: err.message ?? 'Server error' });
});
