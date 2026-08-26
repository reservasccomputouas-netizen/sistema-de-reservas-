import { HttpClient } from '@angular/common/http';
import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { tap, map, catchError, throwError, timeout } from 'rxjs';

export interface AuthUser {
  id: number;
  nombre: string;
  correo: string;
  rol: 'profesor' | 'admin';
  facultad?: string | null;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

export interface FacultadOption {
  id_facultad: number;
  nombre: string;
}

/** Backend wraps all OK responses in { statusCode, message, data } */
interface ApiWrapper<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface LoginPayload {
  correo: string;
  password: string;
}

export interface RegisterPayload {
  nombre: string;
  apellido1: string;
  apellido2?: string;
  correo: string;
  password: string;
  telefono: string;
  facultad: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/api/v1/auth';

  // Reactive signals for auth state
  private readonly _user = signal<AuthUser | null>(this.loadUserFromStorage());
  private readonly _token = signal<string | null>(this.loadTokenFromStorage());

  /** Current authenticated user (readonly signal) */
  readonly user = this._user.asReadonly();

  /** Whether a user is currently logged in */
  readonly isLoggedIn = computed(() => this.hasSession());

  /** Current user role */
  readonly userRole = computed(() => this._user()?.rol ?? null);

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) { }

  // Login
  login(payload: LoginPayload) {
    return this.http
      .post<ApiWrapper<AuthResponse>>(`${this.apiUrl}/login`, payload)
      .pipe(
        timeout(10000),
        map((res) => this.unwrapAuthResponse(res)),
        tap((response) => this.saveSession(response)),
        catchError((err) => throwError(() => err)),
      );
  }

  // Register
  register(payload: RegisterPayload) {
    return this.http
      .post<ApiWrapper<AuthResponse>>(`${this.apiUrl}/register`, payload)
      .pipe(
        timeout(10000),
        map((res) => this.unwrapAuthResponse(res)),
        tap((response) => this.saveSession(response)),
        catchError((err) => throwError(() => err)),
      );
  }

  getFacultades() {
    return this.http
      .get<ApiWrapper<FacultadOption[]>>('http://localhost:3000/api/v1/facultades')
      .pipe(map((response) => response.data));
  }

  // Logout
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this._user.set(null);
    this._token.set(null);
    this.router.navigateByUrl('/login');
  }

  // Token getter (for interceptors)
  getToken(): string | null {
    return this._token();
  }

  hasSession(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  getCurrentUser(): AuthUser | null {
    const current = this._user();
    if (current) return current;

    const stored = this.loadUserFromStorage();
    if (stored) this._user.set(stored);
    return stored;
  }

  // Session helpers
  private unwrapAuthResponse(response: ApiWrapper<AuthResponse> | AuthResponse): AuthResponse {
    const authResponse = 'data' in response ? response.data : response;
    if (!authResponse?.access_token || !authResponse?.user) {
      throw new Error('Respuesta de autenticacion invalida');
    }
    return authResponse;
  }

  private saveSession(response: AuthResponse) {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    this._token.set(response.access_token);
    this._user.set(response.user);
  }

  private loadUserFromStorage(): AuthUser | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed?.correo || (parsed?.rol !== 'admin' && parsed?.rol !== 'profesor')) {
        localStorage.removeItem('user');
        return null;
      }

      return parsed;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  }

  private loadTokenFromStorage(): string | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem('access_token') ?? null;
  }
}
