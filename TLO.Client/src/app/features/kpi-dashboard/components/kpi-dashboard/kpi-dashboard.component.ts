import { Component, OnInit, inject } from '@angular/core';
import { DashboardDto } from '../../../../core/models/dashboard.models';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-kpi-dashboard',
  standalone: true,
  imports: [],
  template: `
    <div class="content">
      <h2 class="mb-4">KPI Dashboard</h2>

      <!-- Totals -->
      <div class="kpi-row mb-4">
        <div class="kpi-card text-center">
          <span class="kpi-value">{{ dashboard?.totals.plans }}</span>
          <span class="kpi-label">Plans Created</span>
        </div>
        <div class="kpi-card text-center">
          <span class="kpi-value">{{ dashboard?.totals.containersLoaded }}</span>
          <span class="kpi-label">Containers Loaded</span>
        </div>
        <div class="kpi-card text-center">
          <span class="kpi-value">{{ dashboard?.totals.slotUtilPct }}%</span>
          <span class="kpi-label">Slot Utilization</span>
        </div>
        <div class="kpi-card text-center">
          <span class="kpi-value">${{ dashboard?.totals.totalCost }}</span>
          <span class="kpi-label">Total Cost</span>
        </div>
        <div class="kpi-card text-center">
          <span class="kpi-value">${{ dashboard?.totals.avgCostPerContainer }}</span>
          <span class="kpi-label">Avg Cost / Container</span>
        </div>
        <div class="kpi-card text-center">
          <span class="kpi-value">{{ dashboard?.totals.lifts }}</span>
          <span class="kpi-label">Total Lifts</span>
        </div>
      </div>

      <!-- Penalty Breakdown -->
      <div class="row g-4 mb-4">
        <div class="col-12 col-md-6">
          <div class="card">
            <div class="card-header">
              <i class="fas fa-exclamation-triangle me-2"></i>Penalty Breakdown
            </div>
            <div class="card-body">
              <table class="table table-sm">
                <tr>
                  <td>Dig</td>
                  <td class="text-end">${{ dashboard?.totals.penalty.dig }}</td>
                </tr>
                <tr>
                  <td>Reposition</td>
                  <td class="text-end">${{ dashboard?.totals.penalty.reposition }}</td>
                </tr>
                <tr>
                  <td>Zone-hop</td>
                  <td class="text-end">${{ dashboard?.totals.penalty.zone }}</td>
                </tr>
                <tr class="fw-bold">
                  <td>Total Penalty</td>
                  <td class="text-end">${{ dashboard?.totals.penalty.total }}</td>
                </tr>
              </table>
              <p class="text-muted small">Penalty share: {{ dashboard?.totals.penaltySharePct }}% of total cost</p>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-6">
          <div class="card">
            <div class="card-header">
              <i class="fas fa-truck me-2"></i>Yard Status
            </div>
            <div class="card-body">
              <table class="table table-sm">
                <tr>
                  <td>Containers Available</td>
                  <td class="text-end">{{ dashboard?.yard.containersAvailable }}</td>
                </tr>
                <tr>
                  <td>Containers Assigned</td>
                  <td class="text-end">{{ dashboard?.yard.containersAssigned }}</td>
                </tr>
                <tr>
                  <td>Railcars Available</td>
                  <td class="text-end">{{ dashboard?.yard.railcarsAvailable }}</td>
                </tr>
                <tr>
                  <td>Railcars Loaded</td>
                  <td class="text-end">{{ dashboard?.yard.railcarsLoaded }}</td>
                </tr>
                <tr>
                  <td>Locomotives Available</td>
                  <td class="text-end">{{ dashboard?.yard.locomotivesAvailable }} / {{ dashboard?.yard.locomotivesTotal }}</td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- By Destination -->
      <div class="card mb-4">
        <div class="card-header">
          <i class="fas fa-map-marker-alt me-2"></i>By Destination
        </div>
        <div class="card-body">
          <table class="table table-striped table-hover">
            <thead>
              <tr>
                <th>Destination</th>
                <th>Plans</th>
                <th>Containers</th>
                <th>Slot Util %</th>
                <th>Total Cost</th>
                <th>Avg Cost</th>
                <th>Waiting</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of dashboard?.byDestination">
                <td>{{ d.name }}</td>
                <td>{{ d.plans }}</td>
                <td>{{ d.containers }}</td>
                <td>{{ d.slotUtilPct }}%</td>
                <td>${{ d.totalCost }}</td>
                <td>${{ d.avgCost }}</td>
                <td>{{ d.waiting }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Plans -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-clock me-2"></i>Recent Plans
        </div>
        <div class="card-body">
          <table class="table table-sm table-hover">
            <thead>
              <tr>
                <th>Plan ID</th>
                <th>Created</th>
                <th>By</th>
                <th>Destination</th>
                <th>Loco</th>
                <th>Containers</th>
                <th>Util %</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of dashboard?.recent">
                <td>{{ p.planId }}</td>
                <td>{{ p.createdAt | date }}</td>
                <td>{{ p.createdBy }}</td>
                <td>{{ p.destName }}</td>
                <td>{{ p.locoId }}</td>
                <td>{{ p.containers }}</td>
                <td>{{ p.slotUtilPct }}%</td>
                <td>${{ p.totalCost }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
    .kpi-card { background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 1rem; }
    .kpi-value { font-size: 1.75rem; font-weight: 700; color: #2c3e50; display: block; }
    .kpi-label { font-size: 0.875rem; color: #6c757d; margin-top: 0.25rem; }
  `]
})
export class KpiDashboardComponent implements OnInit {
  dashboard: DashboardDto | null = null;

  private api = inject(ApiService);
  private auth = inject(AuthService);

  ngOnInit(): void {
    this.api.getDashboard().subscribe((d: DashboardDto) => this.dashboard = d);
  }
}
