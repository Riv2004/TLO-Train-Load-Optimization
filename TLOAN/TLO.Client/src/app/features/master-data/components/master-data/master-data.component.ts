import { Component, OnInit, inject } from '@angular/core';
import { Destination } from '../../../../core/models/destination.model';
import { Locomotive } from '../../../../core/models/locomotive.model';
import { Railcar } from '../../../../core/models/railcar.model';
import { Container } from '../../../../core/models/container.model';
import { YardMapComponent } from '../yard-map/yard-map.component';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-master-data',
  standalone: true,
  imports: [YardMapComponent],
  template: `
    <div class="content">
      <h2 class="mb-4">Master Data</h2>

      <div class="row g-4">
        <!-- Destinations -->
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <i class="fas fa-map-marker-alt me-2"></i>Destinations
            </div>
            <div class="card-body">
              <table class="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Destination ID</th>
                    <th>Name</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let d of destinations">
                    <td>{{ d.destId }}</td>
                    <td>{{ d.name }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Locomotives -->
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <i class="fas fa-train me-2"></i>Locomotives
            </div>
            <div class="card-body">
              <table class="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Locomotive ID</th>
                    <th>Line</th>
                    <th>Orientation</th>
                    <th>Position</th>
                    <th>Status</th>
                    <th>Destination</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let l of locomotives">
                    <td>{{ l.locoId }}</td>
                    <td>{{ l.railLine }}</td>
                    <td>{{ l.orientation }}</td>
                    <td>({{ l.x | number:'1.0-0' }}, {{ l.y | number:'1.0-0' }})</td>
                    <td>
                      <span class="badge" [class.badge-available]="l.status === 'Available'"
                            [class.badge-loaded]="l.status === 'Not Available'">
                        {{ l.status }}
                      </span>
                    </td>
                    <td>{{ l.destination }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Railcars -->
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <i class="fas fa-wagon me-2"></i>Railcars
            </div>
            <div class="card-body">
              <table class="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Railcar ID</th>
                    <th>Type</th>
                    <th>Weight (lb)</th>
                    <th>Status</th>
                    <th>Destination</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let r of railcars">
                    <td>{{ r.railCarId }}</td>
                    <td>{{ r.type }}</td>
                    <td>{{ r.weight | number }}</td>
                    <td>
                      <span class="badge" [class.badge-available]="r.status === 'Available'"
                            [class.badge-loaded]="r.status === 'LOADED'">
                        {{ r.status }}
                      </span>
                    </td>
                    <td>{{ r.destId }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Containers -->
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <i class="fas fa-box me-2"></i>Containers
            </div>
            <div class="card-body">
              <table class="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Container ID</th>
                    <th>Size (ft)</th>
                    <th>Weight (lb)</th>
                    <th>Zone</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Destination</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let c of containers">
                    <td>{{ c.containerId }}</td>
                    <td>{{ c.sizeFt }}</td>
                    <td>{{ c.weight | number }}</td>
                    <td>{{ c.zoneId }}</td>
                    <td>
                      <span class="badge"
                        [class.badge-critical]="c.priority === 'Critical'"
                        [class.badge-high]="c.priority === 'High'"
                        [class.badge-normal]="c.priority === 'Normal'">
                        {{ c.priority }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" [class.badge-available]="c.status === 'Available'"
                            [class.badge-loaded]="c.status === 'ASSIGNED'">
                        {{ c.status }}
                      </span>
                    </td>
                    <td>{{ c.destId }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Yard Map -->
      <div class="row g-4 mt-2">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <i class="fas fa-map me-2"></i>Yard Map
            </div>
            <div class="card-body">
              <app-yard-map [locomotives]="locomotives" [railcars]="railcars" [containers]="containers"></app-yard-map>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MasterDataComponent implements OnInit {
  destinations: Destination[] = [];
  locomotives: Locomotive[] = [];
  railcars: Railcar[] = [];
  containers: Container[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.api.getDestinations().subscribe((d: Destination[]) => this.destinations = d);
    this.api.getLocomotives().subscribe((l: Locomotive[]) => this.locomotives = l);
    this.api.getRailcars().subscribe((r: Railcar[]) => this.railcars = r);
    this.api.getContainers().subscribe((c: Container[]) => this.containers = c);
  }
}