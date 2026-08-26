import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { PublicApiService } from '../../../core/services/public-api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FullCalendarModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private publicApi = inject(PublicApiService);

  esNavegador = isPlatformBrowser(this.platformId);

  calendarOptions: any = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    height: 'auto',
    locale: 'es',
    firstDay: 1,
    weekends: false,
    allDaySlot: false,
    slotMinTime: '07:00:00',
    slotMaxTime: '20:00:00',
    slotDuration: '01:00:00',
    nowIndicator: true,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridWeek,dayGridMonth',
    },
    buttonText: {
      today: 'Hoy',
      week: 'Semana',
      month: 'Mes',
    },
    events: [],
    selectable: true,
    dateClick: (info: any) => {
      alert('Debes iniciar sesión para realizar una reserva');
    },
    select: (info: any) => {
      alert('Debes iniciar sesión para realizar una reserva');
    },
  };

  ngOnInit(): void {
    if (this.esNavegador) {
      this.publicApi.getPublicEvents().subscribe({
        next: (data) => {
          const pEvents = data.map((item) => {
            const isPending = item.estado === 'pendiente';
            return {
              title: isPending ? 'Pendiente' : 'Ocupado',
              start: `${item.fecha_uso}T${item.hora_inicio}`,
              end: `${item.fecha_uso}T${item.hora_fin}`,
              color: isPending ? '#f59e0b' : '#3b82f6',
            };
          });
          this.calendarOptions = { ...this.calendarOptions, events: pEvents };
        },
        error: (err) => console.error('Error cargando eventos:', err),
      });
    }
  }
}
