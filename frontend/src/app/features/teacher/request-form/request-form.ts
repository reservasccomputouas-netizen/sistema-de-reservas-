import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { CreateSolicitudPayload, TeacherApiService } from '../../../core/services/teacher-api.service';

@Component({
  selector: 'app-request-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './request-form.html',
  styleUrl: './request-form.scss',
})
export class RequestFormComponent implements OnInit {
  centers: any[] = [];
  loadingCenters = true;
  saving = false;
  success = '';
  error = '';

  formData = this.emptyForm();

  constructor(
    private readonly teacherApi: TeacherApiService,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.formData.facultad = this.currentFaculty();

    this.teacherApi.getCenters(this.formData.facultad).subscribe({
      next: (centers) => {
        this.centers = this.prioritizeMainCenter(centers);
        this.formData.id_centro = this.centers[0]?.id_centro ?? 1;
        this.loadingCenters = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'No se pudieron cargar los centros de cómputo de tu facultad.';
        this.loadingCenters = false;
        this.cdr.detectChanges();
      },
    });
  }

  enviarSolicitud(form: NgForm): void {
    if (form.invalid || this.saving) {
      form.control.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.success = '';
    this.error = '';

    const requests = this.formData.fechas.map((fecha) => {
      const payload: CreateSolicitudPayload = {
        id_centro: Number(this.formData.id_centro),
        fecha_uso: fecha.fecha_uso,
        hora_inicio: fecha.hora_inicio,
        hora_fin: fecha.hora_fin,
        materia: this.formData.materia.trim(),
        grupo: this.buildGroup(),
        num_alumnos: Number(this.formData.num_alumnos),
        proposito: this.buildPurpose(),
        software_requerido: this.formData.software_requerido.trim(),
        requerimientos: this.selectedRequirements().join(', '),
      };

      return this.teacherApi.createRequest(payload);
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.saving = false;
        this.success = 'Tu solicitud fue enviada, cuentas con 24 hrs. para enviar el oficio de solicitud correspondiente. De lo contrario su solicitud no será autorizada. Para dudas o información, comunícate al correo ccomputourn@uas.edu.mx o al teléfono +52 668 882 4831.';
        const facultad = this.formData.facultad;
        this.formData = this.emptyForm(this.centers[0]?.id_centro ?? 1);
        this.formData.facultad = facultad;
        form.resetForm(this.formData);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message ?? 'No se pudo enviar la solicitud.';
        this.cdr.detectChanges();
      },
    });
  }

  private selectedRequirements(): string[] {
    const entries = [
      ['Internet', this.formData.internet],
      ['Equipo de cómputo', this.formData.equipo],
      ['Proyector', this.formData.proyector],
      ['Software especializado', this.formData.software],
    ];

    return entries.filter(([, selected]) => selected).map(([label]) => label as string);
  }

  private currentFaculty(): string {
    return this.authService.getCurrentUser()?.facultad?.trim() || 'Facultad no registrada';
  }

  private prioritizeMainCenter(centers: any[]): any[] {
    const mainCenterName = this.normalizeText('Sala de computo Torre Academica');
    return [...centers].sort((a, b) => {
      const aIsMain = this.normalizeText(a.nombre) === mainCenterName;
      const bIsMain = this.normalizeText(b.nombre) === mainCenterName;
      return Number(bIsMain) - Number(aIsMain);
    });
  }

  private normalizeText(value?: string): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLocaleLowerCase('es-MX');
  }

  private buildPurpose(): string {
    const tipoUso = this.formData.tipo_uso ? `Tipo de uso: ${this.formData.tipo_uso}` : '';
    const proposito = this.formData.proposito.trim();
    return [tipoUso, proposito].filter(Boolean).join('\n\n');
  }

  private buildGroup(): string {
    return [this.formData.carrera.trim(), this.formData.grupo.trim()].filter(Boolean).join(' - ');
  }

  agregarFecha(): void {
    this.formData.fechas.push({ fecha_uso: '', hora_inicio: '', hora_fin: '' });
  }

  removerFecha(index: number): void {
    if (this.formData.fechas.length > 1) {
      this.formData.fechas.splice(index, 1);
    }
  }

  private emptyForm(id_centro = 1) {
    return {
      id_centro,
      facultad: '',
      tipo_uso: '',
      fechas: [{ fecha_uso: '', hora_inicio: '', hora_fin: '' }],
      materia: '',
      carrera: '',
      grupo: '',
      num_alumnos: 1,
      proposito: '',
      software_requerido: '',
      internet: false,
      equipo: false,
      proyector: false,
      software: false,
    };
  }

  trackByCenterId(index: number, center: any): number {
    return center.id_centro;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
