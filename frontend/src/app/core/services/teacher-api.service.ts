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

export interface CreateSolicitudPayload {
  id_centro: number;
  fecha_uso: string;
  hora_inicio: string;
  hora_fin: string;
  materia: string;
  grupo: string;
  num_alumnos: number;
  proposito?: string;
  software_requerido?: string;
  requerimientos?: string;
}

@Injectable({ providedIn: 'root' })
export class TeacherApiService {
  private readonly apiUrl = 'http://localhost:3000/api/v1';

  constructor(private readonly http: HttpClient) {}

  getDashboard() {
    return this.get<any>('dashboard/profesor');
  }

  getCenters(facultad?: string) {
    return this.get<any[]>('centros', { facultad });
  }

  createRequest(payload: CreateSolicitudPayload) {
    return this.post<any>('solicitudes', payload);
  }

  getMyRequests() {
    return this.get<PaginatedResponse<any>>('solicitudes/mis-solicitudes', { limit: 100 });
  }

  cancelRequest(id: string) {
    return this.patch<any>(`solicitudes/${id}/cancelar`, {});
  }

  getMyReservations() {
    return this.get<PaginatedResponse<any>>('reservas/mis-reservas', { limit: 100 });
  }

  cancelReservation(id: string, motivo = 'Cancelada por el profesor') {
    return this.patch<any>(`reservas/${id}/cancelar`, { motivo });
  }

  markAttendance(id: string, asistencia: boolean) {
    return this.patch<any>(`reservas/${id}/asistencia`, { asistencia });
  }

  getCalendarEvents() {
    return this.get<any[]>('calendario/eventos');
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
