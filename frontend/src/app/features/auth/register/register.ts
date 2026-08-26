import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, FacultadOption } from '../../../core/services/auth.service';

export function uasEmailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const correo = control.value;
    if (!correo) return null;

    // Acepta tanto @ms.uas.edu.mx como @uas.edu.mx
    const esValido = /^[a-zA-Z0-9._%+-]+@(ms\.uas\.edu\.mx|uas\.edu\.mx)$/i.test(correo);
    return esValido ? null : { dominioInvalido: true };
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, NgIf],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  errorMessage = '';
  successMessage = '';
  isSubmitting = false;
  facultades: FacultadOption[] = [];

  form = this.fb.group({
    nombreCompleto: ['', [Validators.required, Validators.minLength(4)]],
    correo: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@uas\.edu\.mx$/i)]],
    telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    facultad: ['', [Validators.required, Validators.minLength(2)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmar: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.authService.getFacultades().subscribe({
      next: (facultades) => {
        this.facultades = facultades;
        if (facultades.length === 1) {
          this.form.patchValue({ facultad: facultades[0].nombre });
        }
      },
      error: () => {
        this.facultades = [{ id_facultad: 0, nombre: 'Facultad de Ingenieria Mochis' }];
        this.form.patchValue({ facultad: this.facultades[0].nombre });
      },
    });
  }

  submit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Completa todos los campos correctamente. El correo debe terminar en @uas.edu.mx.';
      return;
    }

    const { nombreCompleto, correo, facultad, password, confirmar, telefono } = this.form.getRawValue();
    if (password !== confirmar) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    const nombrePartes = this.splitNombre(nombreCompleto ?? '');
    this.isSubmitting = true;

    this.authService
      .register({
        ...nombrePartes,
        correo: correo ?? '',
        password: password ?? '',
        telefono: telefono ?? '',
        facultad: facultad ?? '',
      })
      .subscribe({
        next: () => {
          this.successMessage = 'Cuenta creada correctamente.';
          this.router.navigateByUrl('/app/dashboard');
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage =
            error?.error?.message ?? 'No se pudo crear la cuenta. Intenta de nuevo.';
        },
      });
  }

  private splitNombre(nombreCompleto: string) {
    const partes = nombreCompleto.trim().replace(/\s+/g, ' ').split(' ');
    if (partes.length === 1) {
      return { nombre: partes[0], apellido1: 'Profesor' };
    }

    if (partes.length === 2) {
      return { nombre: partes[0], apellido1: partes[1] };
    }

    return {
      nombre: partes.slice(0, -2).join(' '),
      apellido1: partes.at(-2) ?? 'Profesor',
      apellido2: partes.at(-1),
    };
  }
}
