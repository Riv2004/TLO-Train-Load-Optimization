"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = exports.Store = void 0;
const seed_1 = require("./data/seed");
const auth_1 = require("./auth");
// In-memory store. To move to a real database, replace this module (Prisma/pg) and keep the same shape.
class Store {
    constructor() {
        this.users = [];
        this.destinations = [];
        this.locomotives = [];
        this.railcars = [];
        this.containers = [];
        this.plans = [];
        this.nextPlanId = 1001;
        this.reset();
    }
    reset() {
        this.users = [(0, auth_1.makeUser)('admin', 'admin123', 'admin'), (0, auth_1.makeUser)('planner', 'planner123', 'planner')];
        this.destinations = seed_1.DESTINATIONS.map((d) => ({ ...d }));
        this.locomotives = (0, seed_1.seedLocomotives)();
        this.railcars = (0, seed_1.seedRailcars)();
        this.containers = (0, seed_1.seedContainers)();
        this.plans = [];
        this.nextPlanId = 1001;
    }
    /** Persist a plan, mark railcars LOADED and containers ASSIGNED (step 12). */
    savePlan(plan, createdBy) {
        const saved = { ...plan, planId: this.nextPlanId++, createdAt: new Date().toISOString(), createdBy };
        this.plans.push(saved);
        for (const rc of plan.consist) {
            const r = this.railcars.find((x) => x.railCarId === rc.railCarId);
            if (r)
                Object.assign(r, { status: 'LOADED', order: rc.order, coordinate: rc.coordinate });
        }
        for (const l of plan.lines) {
            const c = this.containers.find((x) => x.containerId === l.containerId);
            if (c)
                c.status = 'ASSIGNED';
        }
        return saved;
    }
}
exports.Store = Store;
exports.store = new Store();
