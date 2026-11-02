import { Component, OnInit, inject } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [],
  template: `
    <div class="content">
      <h2 class="mb-4">Admin - System Management</h2>

      <div class="row g-4">
        <div class="col-12 col-md-6">
          <div class="card">
            <div class="card-header">
              <i class="fas fa-users me-2"></i>Users
            </div>
            <div class="card-body">
              <table class="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let u of users">
                    <td>{{ u.username }}</td>
                    <td>{{ u.role }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-6">
          <div class="card">
            <div class="card-header">
              <i class="fas fa-redo me-2"></i>Reset Yard
            </div>
            <div class="card-body">
              <p class="text-muted">Reset all plans, railcars, and containers to initial state.</p>
              <button class="btn btn-danger" (click)="resetYard()">
                <i class="fas fa-redo me-2"></i>Reset Yard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card mt-3">
        <div class="card-header">
          <i class="fas fa-route me-2"></i>API Endpoints (Swagger)
        </div>
        <div class="card-body">
          <p>View full API documentation at <code>http://localhost:5000/swagger</code>.</p>
          <p>Endpoints available: GET/POST/PUT/DELETE for destinations, locomotives, railcars, containers, plans, dashboard, auth.</p>
        </div>
      </div>
    </div>
  `
})
export class AdminComponent implements OnInit {
  users: { username: string; role: string }[] = [];

  private api = inject(ApiService);

  ngOnInit(): void {
    this.users = [
      { username: 'admin', role: 'Administrator' },
      { username: 'planner', role: 'Planner' }
    ];
  }

  resetYard(): void {
    if (!confirm('Reset all yard data? This will clear plans and re-activate all railcars/containers.')) return;
    this.api.resetYard().subscribe({
      next: () => alert('Yard reset successfully'),
      error: (err: any) => alert('Reset failed: ' + err.message)
    });
  }
}
