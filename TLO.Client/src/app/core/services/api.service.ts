import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Destination } from '../models/destination.model';
import { Locomotive } from '../models/locomotive.model';
import { Railcar } from '../models/railcar.model';
import { Container } from '../models/container.model';
import { PlanRequest, PlanDto } from '../models/plan.models';
import { DashboardDto } from '../models/dashboard.models';

const API_URL = 'http://localhost:5000/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // Auth
  login(username: string, password: string): Observable<any> {
    return this.http.post(`${API_URL}/auth/login`, { username, password });
  }

  // Destinations
  getDestinations(): Observable<Destination[]> {
    return this.http.get<Destination[]>(`${API_URL}/destinations`);
  }

  // Locomotives
  getLocomotives(): Observable<Locomotive[]> {
    return this.http.get<Locomotive[]>(`${API_URL}/locomotives`);
  }

  // Railcars
  getRailcars(destId?: string): Observable<Railcar[]> {
    let params = new HttpParams();
    if (destId) params = params.set('destId', destId);
    return this.http.get<Railcar[]>(`${API_URL}/railcars`, { params });
  }

  // Containers
  getContainers(destId?: string): Observable<Container[]> {
    let params = new HttpParams();
    if (destId) params = params.set('destId', destId);
    return this.http.get<Container[]>(`${API_URL}/containers`, { params });
  }

  // Plans
  optimizePlan(request: PlanRequest): Observable<PlanDto> {
    return this.http.post<PlanDto>(`${API_URL}/plans/optimize`, request);
  }

  savePlan(request: PlanRequest): Observable<PlanDto> {
    return this.http.post<PlanDto>(`${API_URL}/plans`, request);
  }

  getPlans(): Observable<PlanDto[]> {
    return this.http.get<PlanDto[]>(`${API_URL}/plans`);
  }

  getPlan(id: number): Observable<PlanDto> {
    return this.http.get<PlanDto>(`${API_URL}/plans/${id}`);
  }

  // Dashboard
  getDashboard(): Observable<DashboardDto> {
    return this.http.get<DashboardDto>(`${API_URL}/dashboard`);
  }

  resetYard(): Observable<any> {
    return this.http.post(`${API_URL}/reset`, {});
  }
}
