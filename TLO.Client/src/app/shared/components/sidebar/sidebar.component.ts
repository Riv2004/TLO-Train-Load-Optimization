import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="sidebar" [class.visible]="isSidebarOpen" [class.hidden]="!isSidebarOpen">
      <div class="sidebar-header">
        <i class="fas fa-train me-2"></i>
        <span>TLO</span>
      </div>

      <div class="sidebar-nav">
        <div class="nav-item" [routerLinkActive]="'active'" routerLink="/master-data">
          <i class="fas fa-database"></i>
          <span>Master Data</span>
        </div>
        <div class="nav-item" [routerLinkActive]="'active'" routerLink="/optimization-setup">
          <i class="fas fa-cogs"></i>
          <span>Optimization Setup</span>
        </div>
        <div class="nav-item" [routerLinkActive]="'active'" routerLink="/load-plan">
          <i class="fas fa-tasks"></i>
          <span>Load Plan</span>
        </div>
        <div class="nav-item" [routerLinkActive]="'active'" routerLink="/kpi-dashboard">
          <i class="fas fa-chart-pie"></i>
          <span>KPI Dashboard</span>
        </div>
        <div class="nav-item" *ngIf="authService.getRole() === 'admin'" [routerLinkActive]="'active'" routerLink="/admin">
          <i class="fas fa-user-shield"></i>
          <span>Admin</span>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="user-info">
          <div><strong>{{ authService.getUsername() }}</strong></div>
          <div style="font-size: 0.75rem; opacity: 0.8;">Role: {{ authService.getRole() }}</div>
        </div>
        <button class="btn-logout" (click)="logout()">
          <i class="fas fa-sign-out-alt me-2"></i>
          <span>Logout</span>
        </button>
      </div>
    </nav>

    <div class="overlay" *ngIf="isSidebarOpen" (click)="toggleSidebar()"></div>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      background-color: #2c3e50;
      color: white;
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      z-index: 1000;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }
    .sidebar.visible {
      transform: translateX(0);
    }
    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      font-size: 1.25rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .sidebar-nav {
      flex: 1;
      padding: 1rem 0;
      overflow-y: auto;
    }
    .nav-item {
      padding: 0.75rem 1.5rem;
      color: rgba(255,255,255,0.7);
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.2s;
      border-left: 3px solid transparent;
      cursor: pointer;
    }
    .nav-item:hover, .nav-item.active {
      color: white;
      background-color: rgba(255,255,255,0.1);
      border-left-color: #e74c3c;
    }
    .nav-item i {
      width: 20px;
    }
    .sidebar-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    .user-info {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      color: rgba(255,255,255,0.7);
      margin-bottom: 0.5rem;
    }
    .btn-logout {
      width: 100%;
      padding: 0.5rem;
      border: none;
      background-color: rgba(255,255,255,0.1);
      color: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    .btn-logout:hover {
      background-color: rgba(255,255,255,0.2);
    }
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.3);
      z-index: 900;
    }
  `]
})
export class SidebarComponent {
  authService = inject(AuthService);
  router = inject(Router);
  isSidebarOpen = false;

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.isSidebarOpen = false;
  }
}
