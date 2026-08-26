import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PublicApiService {
  private readonly apiUrl = 'https://api-reservas-uas.onrender.com/api/v1';

  constructor(private http: HttpClient) { }

  getPublicEvents() {
    return this.http.get<any[]>(`${this.apiUrl}/reservas/public/eventos`);
  }
}
