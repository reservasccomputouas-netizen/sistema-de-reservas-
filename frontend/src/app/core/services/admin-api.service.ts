import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';

interface ApiWrapper<T> {
  data: T;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CentroComputo {
  id_centro: number;
  id_facultad?: number | null;
  nombre: string;
  capacidad: number;
  descripcion?: string;
  activo: boolean;
  es_general: boolean;
  facultad?: Facultad | null;
}

export interface Facultad {
  id_facultad: number;
  nombre: string;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly apiUrl = 'https://api-reservas-uas.onrender.com/api/v1';

  constructor(private readonly http: HttpClient) { }

  getDashboard() {
    return this.get<any>('dashboard/admin');
  }

  getRequests(estado = 'pendiente') {
    return this.get<PaginatedResponse<any>>('solicitudes', { estado, limit: 100 });
  }

  approveRequest(id: string) {
    return this.post<any>(`solicitudes/${id}/aprobar`, {});
  }

  rejectRequest(id: string, motivo: string) {
    return this.post<any>(`solicitudes/${id}/rechazar`, { motivo });
  }

  getUsers(buscar = '') {
    return this.get<PaginatedResponse<any>>('users', { buscar, limit: 100 });
  }

  toggleUser(id: string) {
    return this.patch<any>(`users/${id}/toggle-active`, {});
  }

  deleteUser(id: string) {
    return this.delete<any>(`users/${id}`);
  }

  getBlocks() {
    return this.get<any[]>('bloqueos');
  }

  createBlock(payload: { id_centro: number; date: string; startTime: string; endTime: string; reason: string }) {
    return this.post<any>('bloqueos', payload);
  }

  deleteBlock(id: string) {
    return this.delete<any>(`bloqueos/${id}`);
  }

  getCalendarEvents() {
    return this.get<any[]>('calendario/eventos');
  }

  getHistory() {
    return this.get<PaginatedResponse<any>>('historial', { limit: 100 });
  }

  getCentersAdmin() {
    return this.get<CentroComputo[]>('centros/admin');
  }

  createCenter(payload: { id_facultad: number; nombre: string; capacidad: number; descripcion?: string; activo?: boolean; es_general?: boolean }) {
    return this.post<CentroComputo>('centros', payload);
  }

  updateCenter(id: number, payload: { id_facultad?: number; nombre?: string; capacidad?: number; descripcion?: string; activo?: boolean; es_general?: boolean }) {
    return this.patch<CentroComputo>(`centros/${id}`, payload);
  }

  toggleCenter(id: number) {
    return this.patch<CentroComputo>(`centros/${id}/toggle-active`, {});
  }

  getFacultiesAdmin() {
    return this.get<Facultad[]>('facultades/admin');
  }

  createFaculty(payload: { nombre: string; activo?: boolean }) {
    return this.post<Facultad>('facultades', payload);
  }

  updateFaculty(id: number, payload: { nombre?: string; activo?: boolean }) {
    return this.patch<Facultad>(`facultades/${id}`, payload);
  }

  toggleFaculty(id: number) {
    return this.patch<Facultad>(`facultades/${id}/toggle-active`, {});
  }

  private get<T>(path: string, params?: Record<string, string | number | undefined>) {
    return this.http
      .get<ApiWrapper<T>>(`${this.apiUrl}/${path}`, { params: this.buildParams(params) })
      .pipe(map((response) => response.data));
  }

  private post<T>(path: string, body: unknown) {
    return this.http.post<ApiWrapper<T>>(`${this.apiUrl}/${path}`, body).pipe(map((response) => response.data));
  }

  private patch<T>(path: string, body: unknown) {
    return this.http.patch<ApiWrapper<T>>(`${this.apiUrl}/${path}`, body).pipe(map((response) => response.data));
  }

  private delete<T>(path: string) {
    return this.http.delete<ApiWrapper<T>>(`${this.apiUrl}/${path}`).pipe(map((response) => response.data));
  }

  private buildParams(params?: Record<string, string | number | undefined>) {
    let httpParams = new HttpParams();
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return httpParams;
  }
}
