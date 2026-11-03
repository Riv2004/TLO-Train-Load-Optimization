import { Component } from '@angular/core';
import { NgModel, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="text-center mb-4">
          <i class="fas fa-train" style="font-size: 3rem; color: #2c3e50;"></i>
          <h2 class="mt-2">Train Load Optimization</h2>
          <p class="text-muted">Please sign in to continue</p>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="mb-3">
            <label class="form-label">Username</label>
            <input type="text" class="form-control" [(ngModel)]="username" name="username" required />
          </div>

          <div class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" [(ngModel)]="password" name="password" required />
          </div>

          <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

          <button type="submit" class="btn btn-primary w-100" [disabled]="!loginForm.form.valid || loading">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
            <i *ngIf="!loading" class="fas fa-sign-in-alt me-2"></i>
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="mt-3 text-center text-muted small">
          <p>Default credentials:</p>
          <p><strong>admin</strong> / <strong>admin123</strong> (Administrator)</p>
          <p><strong>planner</strong> / <strong>planner123</strong> (Planner)</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
      padding: 1rem;
    }
    .login-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      width: 100%;
      max-width: 420px;
    }
    .form-label {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 0.25rem;
    }
    .form-control {
      border-radius: 6px;
      padding: 0.6rem 0.75rem;
    }
    .btn-primary {
      background-color: #2c3e50;
      border-color: #2c3e50;
      padding: 0.6rem;
      font-weight: 600;
    }
    .btn-primary:hover {
      background-color: #1a252f;
      border-color: #1a252f;
    }
    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .spinner-border {
      width: 1rem;
      height: 1rem;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spinner-border 0.75s linear infinite;
    }
    @keyframes spinner-border {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.error = '';
    this.loading = true;

    this.authService.login({ username: this.username, password: this.password })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.router.navigate(['/master-data']);
        },
        error: (err: HttpErrorResponse) => {
          this.error = err.status === 401 ? 'Invalid username or password' : 'Login failed. Please try again.';
        }
      });
  }
}
