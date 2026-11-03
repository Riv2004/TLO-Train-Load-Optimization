import { Component, OnChanges, SimpleChanges, inject } from '@angular/core';
import { Locomotive } from '../../../../core/models/locomotive.model';
import { Railcar } from '../../../../core/models/railcar.model';
import { Container } from '../../../../core/models/container.model';
import { NgFor, NgIf } from '@angular/common';

interface YardPoint {
  x: number;
  y: number;
  label: string;
  type: 'locomotive' | 'railcar' | 'container';
  extra?: string;
}

const X0 = -10, X1 = 10, Y0 = -10, Y1 = 10;

@Component({
  selector: 'app-yard-map',
  standalone: true,
  imports: [NgFor, NgIf],
  template: `
    <div class="yard-map-container">
      <svg viewBox="-10 -10 20 20" class="yard-map" preserveAspectRatio="xMidYMid meet">
        <!-- Grid lines -->
        <g stroke="#e0e0e0" stroke-width="0.1">
          <line *ngFor="let i of gridLines" [x1]="i" [y1]="Y0" [x2]="i" [y2]="Y1" />
          <line *ngFor="let i of gridLines" [x1]="X0" [y1]="i" [x2]="X1" [y2]="i" />
        </g>

        <!-- Rail lines 1-5 (vertical through origin) -->
        <g stroke="#3498db" stroke-width="0.15" stroke-dasharray="0.2 0.15">
          <line *ngFor="let x of verticalLines" [x1]="x" [y1]="Y0" [x2]="x" [y2]="Y1" />
        </g>

        <!-- Rail lines 6-9 (horizontal through origin) -->
        <g stroke="#2980b9" stroke-width="0.15" stroke-dasharray="0.2 0.15">
          <line *ngFor="let y of horizontalLines" [x1]="X0" [y1]="y" [x2]="X1" [y2]="y" />
        </g>

        <!-- Axes -->
        <line [x1]="X0" [y1]="0" [x2]="X1" [y2]="0" stroke="#000" stroke-width="0.1" />
        <line [x1]="0" [y1]="Y0" [x2]="0" [y2]="Y1" stroke="#000" stroke-width="0.1" />

        <!-- Origin (crane) -->
        <circle cx="0" cy="0" r="0.3" fill="#e74c3c" />
        <text x="0.4" y="-0.4" font-size="0.4" fill="#e74c3c" font-weight="bold">CRANE</text>

        <!-- Points -->
        <g *ngFor="let point of points">
          <circle [cx]="point.x" [cy]="point.y" r="0.25" [fill]="pointColor(point)" />
          <text [x]="point.x + 0.25" [y]="point.y - 0.25" font-size="0.3" fill="#333">{{ point.label }}</text>
        </g>
      </svg>

      <div class="yard-legend">
        <div class="legend-item"><span class="legend-dot locomotive"></span> Locomotive</div>
        <div class="legend-item"><span class="legend-dot railcar"></span> Railcar</div>
        <div class="legend-item"><span class="legend-dot container"></span> Container</div>
      </div>
    </div>
  `,
  styles: [`
    .yard-map-container {
      width: 100%;
      overflow: hidden;
    }
    .yard-map {
      width: 100%;
      height: auto;
      display: block;
    }
    .yard-legend {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 0.5rem;
      font-size: 0.8rem;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
    }
    .legend-dot.locomotive { background-color: #e74c3c; }
    .legend-dot.railcar { background-color: #3498db; }
    .legend-dot.container { background-color: #2ecc71; }
  `]
})
export class YardMapComponent implements OnChanges {
  locomotives: Locomotive[] = [];
  railcars: Railcar[] = [];
  containers: Container[] = [];

  X0 = -10, X1 = 10, Y0 = -10, Y1 = 10;
  gridLines: number[] = [-8, -6, -4, -2, 0, 2, 4, 6, 8];
  verticalLines: number[] = [-4, -3, -2, -1, 1];
  horizontalLines: number[] = [-4, -3, -2, -1];

  points: YardPoint[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.points = [];
    for (const l of this.locomotives) {
      this.points.push({ x: l.x, y: l.y, label: l.locoId, type: 'locomotive', extra: l.status });
    }
    for (const r of this.railcars) {
      if (r.x != null && r.y != null) {
        this.points.push({ x: r.x, y: r.y, label: r.railCarId, type: 'railcar', extra: r.status });
      }
    }
    for (const c of this.containers) {
      this.points.push({ x: c.x, y: c.y, label: c.containerId, type: 'container', extra: c.priority });
    }
  }

  pointColor(point: YardPoint): string {
    switch (point.type) {
      case 'locomotive': return '#e74c3c';
      case 'railcar': return '#3498db';
      case 'container': return '#2ecc71';
    }
  }
}