import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Destination } from '../../../../core/models/destination.model';
import { PlanRequest, PlanDto } from '../../../../core/models/plan.models';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-optimization-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="content">
      <h2 class="mb-4">Optimization Setup</h2>

      <div class="card">
        <div class="card-header">
          <i class="fas fa-cogs me-2"></i>Create Load Plan
        </div>
        <div class="card-body">
          <form (ngSubmit)="onSubmit()" #planForm="ngForm">
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Destination <span class="text-danger">*</span></label>
                <select class="form-select" [(ngModel)]="request.destId" name="destId" required>
                  <option value="">Select destination</option>
                  <option *ngFor="let d of destinations" [value]="d.destId">{{ d.name }} ({{ d.destId }})</option>
                </select>
              </div>

              <div class="col-md-3">
                <label class="form-label">Railcar Count <span class="text-danger">*</span></label>
                <input type="number" class="form-control" [(ngModel)]="request.railcarCount" name="railcarCount"
                  required min="1" max="5" placeholder="1-5" />
              </div>

              <div class="col-md-4">
                <label class="form-label">Locomotive ID (optional)</label>
                <input type="text" class="form-control" [(ngModel)]="request.locoId" name="locoId"
                  placeholder="e.g. LOC-0200" />
              </div>

              <div class="col-12 d-grid mt-3">
                <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading">
                  <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                  Run Optimization
                </button>
              </div>
            </div>

            <div *ngIf="error" class="alert alert-danger mt-3">{{ error }}</div>
            <div *ngIf="success" class="alert alert-success mt-3">{{ success }}</div>
          </form>
        </div>
      </div>

      <!-- Result -->
      <div *ngIf="planResult" class="card mt-4">
        <div class="card-header">
          <i class="fas fa-tasks me-2"></i>Optimization Result
        </div>
        <div class="card-body">
          <div class="row g-4 mb-4">
            <div class="col-12 col-md-4">
              <div class="kpi-card text-center">
                <span class="kpi-value">{{ planResult.kpis.slotsFilled }}</span>
                <span class="kpi-label">Containers Placed</span>
              </div>
            </div>
            <div class="col-12 col-md-4">
              <div class="kpi-card text-center">
                <span class="kpi-value">{{ planResult.kpis.slotUtilPct }}%</span>
                <span class="kpi-label">Slot Utilization</span>
              </div>
            </div>
            <div class="col-12 col-md-4">
              <div class="kpi-card text-center">
                <span class="kpi-value">${{ planResult.kpis.totalCost }}</span>
                <span class="kpi-label">Total Cost</span>
              </div>
            </div>
          </div>

          <div class="row g-4">
            <div class="col-12">
              <div class="card">
                <div class="card-header">Assignment Lines</div>
                <div class="card-body">
                  <table class="table table-sm table-striped">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Container</th>
                        <th>Railcar</th>
                        <th>Well</th>
                        <th>Slot</th>
                        <th>Rail Line</th>
                        <th>Cost</th>
                        <th>Lifts</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let line of planResult.lines">
                        <td>{{ line.lineNo }}</td>
                        <td>{{ line.containerId }}</td>
                        <td>{{ line.railCarId }}</td>
                        <td>{{ line.wellId }}</td>
                        <td>{{ line.slotId }} ({{ line.slotType }})</td>
                        <td>{{ line.railLine }}</td>
                        <td>${{ line.cost }}</td>
                        <td>{{ line.lifts }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="planResult.unassigned.length > 0" class="card mt-3">
            <div class="card-header bg-warning text-dark">Unassigned Containers</div>
            <div class="card-body">
              <ul class="list-unstyled">
                <li *ngFor="let u of planResult.unassigned">
                  <strong>{{ u.containerId }}</strong>: {{ u.reason }}
                </li>
              </ul>
            </div>
          </div>

          <div class="mt-3 d-flex gap-2">
            <button class="btn btn-success" (click)="savePlan()">Save Plan</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kpi-card { background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 1.25rem; }
    .kpi-value { font-size: 1.75rem; font-weight: 700; color: #2c3e50; display: block; }
    .kpi-label { font-size: 0.875rem; color: #6c757d; margin-top: 0.25rem; }
  `]
})
export class OptimizationSetupComponent implements OnInit {
  destinations: Destination[] = [];
  planResult: PlanDto | null = null;
  error = '';
  success = '';
  loading = false;

  request: PlanRequest = { destId: '', railcarCount: 1 };

  private api = inject(ApiService);
  private auth = inject(AuthService);

  ngOnInit(): void {
    this.api.getDestinations().subscribe((d: Destination[]) => this.destinations = d);
  }

  onSubmit(): void {
    this.error = '';
    this.success = '';
    this.loading = true;

    this.api.optimizePlan({ ...this.request }).subscribe({
      next: (result) => {
        this.planResult = result;
        this.success = `Optimization complete. ${result.kpis.slotsFilled} container(s) placed.`;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.error || 'Optimization failed';
        this.loading = false;
      }
    });
  }

  savePlan(): void {
    if (!this.planResult) return;
    this.loading = true;

    this.api.savePlan({ ...this.request }).subscribe({
      next: (result) => {
        this.success = 'Plan saved successfully.';
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.error || 'Save failed';
        this.loading = false;
      }
    });
  }
}
