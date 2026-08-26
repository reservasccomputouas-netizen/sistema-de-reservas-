import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PublicApiService {
  private readonly apiUrl = 'http://localhost:3000/api/v1';

  constructor(private http: HttpClient) {}

  getPublicEvents() {
    return this.http.get<any[]>(`${this.apiUrl}/reservas/public/eventos`);
  }
}
