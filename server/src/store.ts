import { Container, Destination, LoadPlan, Locomotive, Railcar, User } from './types';
import { DESTINATIONS, seedContainers, seedLocomotives, seedRailcars } from './data/seed';
import { makeUser } from './auth';

// In-memory store. To move to a real database, replace this module (Prisma/pg) and keep the same shape.
export class Store {
  users: User[] = [];
  destinations: Destination[] = [];
  locomotives: Locomotive[] = [];
  railcars: Railcar[] = [];
  containers: Container[] = [];
  plans: LoadPlan[] = [];
  private nextPlanId = 1001;

  constructor() { this.reset(); }

  reset() {
    this.users = [makeUser('admin', 'admin123', 'admin'), makeUser('planner', 'planner123', 'planner')];
    this.destinations = DESTINATIONS.map((d) => ({ ...d }));
    this.locomotives = seedLocomotives();
    this.railcars = seedRailcars();
    this.containers = seedContainers();
    this.plans = [];
    this.nextPlanId = 1001;
  }

  /** Persist a plan, mark railcars LOADED and containers ASSIGNED (step 12). */
  savePlan(plan: LoadPlan, createdBy: string): LoadPlan {
    const saved: LoadPlan = { ...plan, planId: this.nextPlanId++, createdAt: new Date().toISOString(), createdBy };
    this.plans.push(saved);
    for (const rc of plan.consist) {
      const r = this.railcars.find((x) => x.railCarId === rc.railCarId);
      if (r) Object.assign(r, { status: 'LOADED', order: rc.order, coordinate: rc.coordinate });
    }
    for (const l of plan.lines) {
      const c = this.containers.find((x) => x.containerId === l.containerId);
      if (c) c.status = 'ASSIGNED';
    }
    return saved;
  }
}
export const store = new Store();
