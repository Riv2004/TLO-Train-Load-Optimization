import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/components/login/login.component').then(m => m.LoginComponent) },
  { path: '', redirectTo: '/master-data', pathMatch: 'full' },
  {
    path: 'master-data',
    loadComponent: () => import('./features/master-data/components/master-data/master-data.component').then(m => m.MasterDataComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'optimization-setup',
    loadComponent: () => import('./features/optimization/components/optimization-setup/optimization-setup.component').then(m => m.OptimizationSetupComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'load-plan',
    loadComponent: () => import('./features/load-plan/components/load-plan/load-plan.component').then(m => m.LoadPlanComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'kpi-dashboard',
    loadComponent: () => import('./features/kpi-dashboard/components/kpi-dashboard/kpi-dashboard.component').then(m => m.KpiDashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/master-data/components/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'admin' }
  }
];
