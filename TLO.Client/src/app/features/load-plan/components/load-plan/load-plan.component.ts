import { Component, OnInit, inject } from '@angular/core';
import { PlanDto } from '../../../../core/models/plan.models';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-load-plan',
  standalone: true,
  imports: [],
  template: `
    <div class="content">
      <h2 class="mb-4">Load Plan</h2>

      <div class="card mb-4">
        <div class="card-header">
          <i class="fas fa-list me-2"></i>Saved Plans
        </div>
        <div class="card-body">
          <table class="table table-striped table-hover">
            <thead>
              <tr>
                <th>Plan ID</th>
                <th>Created</th>
                <th>By</th>
                <th>Destination</th>
                <th>Loco</th>
                <th>Line</th>
                <th>Containers</th>
                <th>Util %</th>
                <th>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of plans">
                <td>{{ p.planId }}</td>
                <td>{{ p.createdAt | date }}</td>
                <td>{{ p.createdBy }}</td>
                <td>{{ p.destName }}</td>
                <td>{{ p.locoId }}</td>
                <td>{{ p.railLine }}</td>
                <td>{{ p.lines.length }}</td>
                <td>{{ p.kpis.slotUtilPct }}%</td>
                <td>${{ p.kpis.totalCost }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="selectedPlan" class="card">
        <div class="card-header">
          <i class="fas fa-eye me-2"></i>Plan #{{ selectedPlan.planId }} Details
        </div>
        <div class="card-body">
          <div class="row g-4 mb-4">
            <div class="col-12 col-md-3">
              <div class="kpi-card text-center">
                <span class="kpi-value">{{ selectedPlan.kpis.slotsFilled }}</span>
                <span class="kpi-label">Placed</span>
              </div>
            </div>
            <div class="col-12 col-md-3">
              <div class="kpi-card text-center">
                <span class="kpi-value">{{ selectedPlan.kpis.slotUtilPct }}%</span>
                <span class="kpi-label">Slot Util</span>
              </div>
            </div>
            <div class="col-12 col-md-3">
              <div class="kpi-card text-center">
                <span class="kpi-value">${{ selectedPlan.kpis.totalCost }}</span>
                <span class="kpi-label">Total Cost</span>
              </div>
            </div>
            <div class="col-12 col-md-3">
              <div class="kpi-card text-center">
                <span class="kpi-value">${{ selectedPlan.kpis.avgCostPerContainer }}</span>
                <span class="kpi-label">Avg Cost</span>
              </div>
            </div>
          </div>

          <table class="table table-sm table-striped">
            <thead>
              <tr>
                <th>#</th>
                <th>Container</th>
                <th>Railcar</th>
                <th>Well</th>
                <th>Slot</th>
                <th>Rail Line</th>
                <th>Travel</th>
                <th>Dig</th>
                <th>Reposition</th>
                <th>Zone</th>
                <th>Cost</th>
                <th>Lifts</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let line of selectedPlan.lines">
                <td>{{ line.lineNo }}</td>
                <td>{{ line.containerId }}</td>
                <td>{{ line.railCarId }}</td>
                <td>{{ line.wellId }}</td>
                <td>{{ line.slotId }} ({{ line.slotType }})</td>
                <td>{{ line.railLine }}</td>
                <td>{{ line.travel }}</td>
                <td>{{ line.dig }}</td>
                <td>{{ line.reposition }}</td>
                <td>{{ line.zone }}</td>
                <td>${{ line.cost }}</td>
                <td>{{ line.lifts }}</td>
              </tr>
            </tbody>
          </table>

          <div *ngIf="selectedPlan.unassigned.length > 0" class="alert alert-warning mt-3">
            <strong>Unassigned:</strong>
            <ul class="mb-0 mt-2">
              <li *ngFor="let u of selectedPlan.unassigned">{{ u.containerId }}: {{ u.reason }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kpi-card { background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 1rem; }
    .kpi-value { font-size: 1.5rem; font-weight: 700; color: #2c3e50; display: block; }
    .kpi-label { font-size: 0.8rem; color: #6c757d; margin-top: 0.25rem; }
  `]
})
export class LoadPlanComponent implements OnInit {
  plans: PlanDto[] = [];
  selectedPlan: PlanDto | null = null;

  private api = inject(ApiService);
  private auth = inject(AuthService);

  ngOnInit(): void {
    this.api.getPlans().subscribe((p: PlanDto[]) => this.plans = p);
  }

  viewPlan(id: number): void {
    this.api.getPlan(id).subscribe((p: PlanDto) => this.selectedPlan = p);
  }
}