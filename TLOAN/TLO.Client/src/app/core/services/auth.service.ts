import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { LoginRequest, LoginResponse, User } from '../models/auth.models';

const API_URL = 'http://localhost:5000/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'tlo_token';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const token = this.getToken();
    const username = localStorage.getItem('tlo_username');
    const role = localStorage.getItem('tlo_role');
    if (token && username && role) {
      this.currentUserSubject.next({ username, role: role as 'admin' | 'planner' });
    }
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, request).pipe(
      tap(response => {
        localStorage.setItem(this.tokenKey, response.token);
        localStorage.setItem('tlo_username', response.username);
        localStorage.setItem('tlo_role', response.role);
        this.currentUserSubject.next({ username: response.username, role: response.role as 'admin' | 'planner' });
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('tlo_username');
    localStorage.removeItem('tlo_role');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUsername(): string | null {
    return localStorage.getItem('tlo_username');
  }

  getRole(): 'admin' | 'planner' | null {
    const role = localStorage.getItem('tlo_role');
    return role === 'admin' || role === 'planner' ? role : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
