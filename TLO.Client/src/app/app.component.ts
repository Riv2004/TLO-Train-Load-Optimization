import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { TopHeaderComponent } from './shared/components/top-header/top-header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopHeaderComponent],
  template: `
    <app-sidebar></app-sidebar>
    <div class="main-content">
      <app-top-header></app-top-header>
      <div class="content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class AppComponent {
  authService = inject(AuthService);
  router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
