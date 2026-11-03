import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-top-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="top-header">
      <button class="toggle-sidebar" (click)="toggleSidebar()" aria-label="Toggle menu">
        <i class="fas fa-bars"></i>
      </button>
      <h2 class="page-title">TLO - Train Load Optimization</h2>
      <span class="user-badge">
        <i class="fas fa-user me-1"></i>
        {{ authService.getUsername() }} ({{ authService.getRole() }})
      </span>
    </header>
  `,
  styles: [`
    .top-header {
      height: 60px;
      background-color: white;
      border-bottom: 1px solid #dee2e6;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .toggle-sidebar {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: #2c3e50;
    }
    .page-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #2c3e50;
      margin: 0;
    }
    .user-badge {
      font-size: 0.875rem;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      background-color: #e9ecef;
      color: #2c3e50;
    }
  `]
})
export class TopHeaderComponent {
  authService = inject(AuthService);
  router = inject(Router);

  toggleSidebar(): void {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('visible');
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
