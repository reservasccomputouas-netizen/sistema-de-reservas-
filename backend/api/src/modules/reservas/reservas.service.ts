import {
    Injectable, BadRequestException, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reserva, ReservaEstado } from './entities/reserva.entity';
import { Solicitud, SolicitudEstado } from '../solicitudes/entities/solicitud.entity';
import { BloqueoHorario } from '../bloqueos/entities/bloqueo.entity';
import { CentroComputo } from '../centros/entities/centro-computo.entity';
import { HistorialService } from '../historial/historial.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { NotificacionTipo } from '../notificaciones/entities/notificacion.entity';
import { User } from '../users/entities/user.entity';
import { IsString, IsOptional, Matches, IsDateString, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RescheduleDto {
    @IsDateString() nueva_fecha: string;
    @IsString() @Matches(/^\d{2}:\d{2}$/) nueva_hora_inicio: string;
    @IsString() @Matches(/^\d{2}:\d{2}$/) nueva_hora_fin: string;
}

export class AttendanceDto {
    @IsBoolean() asistencia: boolean;
}

export class CheckDisponibilidadDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    id_centro: number;

    @IsDateString()
    fecha: string;

    @IsString()
    @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
    hora_inicio: string;

    @IsString()
    @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
    hora_fin: string;
}

@Injectable()
export class ReservasService {
    constructor(
        @InjectRepository(Reserva) private repo: Repository<Reserva>,
        @InjectRepository(Solicitud) private solicitudRepo: Repository<Solicitud>,
        @InjectRepository(BloqueoHorario) private bloqueoRepo: Repository<BloqueoHorario>,
        @InjectRepository(CentroComputo) private centroRepo: Repository<CentroComputo>,
        private historialSvc: HistorialService,
        private notifSvc: NotificacionesService,
    ) { }

    findAllForUser(id_usuario: number, page = 1, limit = 20, estado?: string) {
        const qb = this.repo.createQueryBuilder('r')
            .leftJoinAndSelect('r.solicitud', 's')
            .leftJoinAndSelect('r.centro', 'c')
            .where('r.id_usuario = :id_usuario', { id_usuario })
            .orderBy('r.fecha_uso', 'DESC');

        if (estado) qb.andWhere('r.estado = :estado', { estado });

        return qb
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount()
            .then(([data, total]) => ({
                data, total, page, limit,
                totalPages: Math.ceil(total / limit),
            }));
    }

    findAll(page = 1, limit = 20, estado?: string, buscar?: string) {
        const qb = this.repo.createQueryBuilder('r')
            .leftJoinAndSelect('r.usuario', 'u')
            .leftJoinAndSelect('r.solicitud', 's')
            .leftJoinAndSelect('r.centro', 'c')
            .orderBy('r.fecha_uso', 'DESC');

        if (estado) qb.andWhere('r.estado = :estado', { estado });
        if (buscar) {
            qb.andWhere('(u.nombre LIKE :b OR u.apellido1 LIKE :b)', { b: `%${buscar}%` });
        }

        return qb
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount()
            .then(([data, total]) => ({
                data, total, page, limit,
                totalPages: Math.ceil(total / limit),
            }));
    }

    async checkDisponibilidad(dto: CheckDisponibilidadDto) {
        const horaInicio = this.normalizeTime(dto.hora_inicio);
        const horaFin = this.normalizeTime(dto.hora_fin);

        if (horaInicio >= horaFin) {
            throw new BadRequestException('La hora de inicio debe ser menor a la hora de fin');
        }

        const centro = await this.centroRepo.findOne({
            where: { id_centro: dto.id_centro, activo: true },
        });
        if (!centro) {
            throw new NotFoundException(`Centro de cómputo #${dto.id_centro} no disponible`);
        }

        const reserva = await this.repo
            .createQueryBuilder('r')
            .where('r.id_centro = :idCentro', { idCentro: dto.id_centro })
            .andWhere('r.fecha_uso = :fecha', { fecha: dto.fecha })
            .andWhere('r.estado = :estado', { estado: ReservaEstado.ACTIVA })
            .andWhere('r.hora_inicio < :horaFin AND r.hora_fin > :horaInicio', {
                horaInicio,
                horaFin,
            })
            .getOne();

        const solicitud = await this.solicitudRepo
            .createQueryBuilder('s')
            .where('s.id_centro = :idCentro', { idCentro: dto.id_centro })
            .andWhere('s.fecha_uso = :fecha', { fecha: dto.fecha })
            .andWhere('s.estado IN (:...estados)', {
                estados: [SolicitudEstado.PENDIENTE, SolicitudEstado.APROBADA],
            })
            .andWhere('s.hora_inicio < :horaFin AND s.hora_fin > :horaInicio', {
                horaInicio,
                horaFin,
            })
            .getOne();

        const bloqueo = await this.bloqueoRepo
            .createQueryBuilder('b')
            .where('b.id_centro = :idCentro', { idCentro: dto.id_centro })
            .andWhere('DATE(b.fecha_inicio) = :fecha', { fecha: dto.fecha })
            .andWhere('TIME(b.fecha_inicio) < :horaFin AND TIME(b.fecha_fin) > :horaInicio', {
                horaInicio,
                horaFin,
            })
            .getOne();

        const conflictos = [
            reserva && {
                tipo: 'reserva',
                id: reserva.id_reserva,
                fecha: reserva.fecha_uso,
                hora_inicio: reserva.hora_inicio,
                hora_fin: reserva.hora_fin,
            },
            solicitud && {
                tipo: 'solicitud',
                id: solicitud.id_solicitud,
                estado: solicitud.estado,
                fecha: solicitud.fecha_uso,
                hora_inicio: solicitud.hora_inicio,
                hora_fin: solicitud.hora_fin,
            },
            bloqueo && {
                tipo: 'bloqueo',
                id: bloqueo.id_bloqueo,
                motivo: bloqueo.motivo,
                fecha_inicio: bloqueo.fecha_inicio,
                fecha_fin: bloqueo.fecha_fin,
            },
        ].filter(Boolean);

        return {
            disponible: conflictos.length === 0,
            id_centro: dto.id_centro,
            fecha: dto.fecha,
            hora_inicio: horaInicio,
            hora_fin: horaFin,
            conflictos,
        };
    }

    async findOne(id: number): Promise<Reserva> {
        const r = await this.repo.findOne({ 
            where: { id_reserva: id },
            relations: ['solicitud', 'usuario', 'centro'] 
        });
        if (!r) throw new NotFoundException(`Reserva #${id} no encontrada`);
        return r;
    }

    async cancel(id: number, user: User, motivo?: string): Promise<Reserva> {
        const r = await this.findOne(id);

        if (user.rol !== 'admin' && r.id_usuario !== user.id_usuario)
            throw new ForbiddenException('No puedes cancelar una reserva de otro usuario');
        if (r.estado !== ReservaEstado.ACTIVA)
            throw new BadRequestException('Solo puedes cancelar reservas activas');

        await this.repo.update(id, {
            estado: ReservaEstado.CANCELADA,
            motivo_cancelacion: motivo ?? 'Cancelada por el usuario',
        });

        if (user.rol === 'admin' && r.id_usuario !== user.id_usuario) {
            await this.notifSvc.create({
                id_usuario: r.id_usuario,
                tipo: NotificacionTipo.RESERVA_CANCELADA,
                titulo: 'Tu reserva fue cancelada',
                mensaje: motivo ?? 'El administrador canceló tu reserva',
                id_entidad_ref: id,
            });
        }

        await this.historialSvc.log(user.id_usuario, 'CANCELAR_RESERVA', 'reserva', id);
        return this.findOne(id);
    }

    async reschedule(id: number, dto: RescheduleDto, user: User): Promise<Reserva> {
        const r = await this.findOne(id);
        if (r.id_usuario !== user.id_usuario)
            throw new ForbiddenException('No puedes reprogramar una reserva de otro usuario');
        if (r.estado !== ReservaEstado.ACTIVA)
            throw new BadRequestException('Solo puedes reprogramar reservas activas');

        const conflicto = await this.repo
            .createQueryBuilder('r')
            .where('r.id_centro = :c', { c: r.id_centro })
            .andWhere('r.fecha_uso = :f', { f: dto.nueva_fecha })
            .andWhere('r.estado = :e', { e: 'activa' })
            .andWhere('r.hora_inicio < :fin AND r.hora_fin > :inicio', {
                inicio: dto.nueva_hora_inicio,
                fin: dto.nueva_hora_fin,
            })
            .andWhere('r.id_reserva != :id', { id })
            .getOne();

        if (conflicto)
            throw new BadRequestException('El nuevo horario no está disponible');

        await this.repo.update(id, {
            fecha_uso: dto.nueva_fecha,
            hora_inicio: dto.nueva_hora_inicio,
            hora_fin: dto.nueva_hora_fin,
            estado: ReservaEstado.ACTIVA,
        });

        await this.historialSvc.log(user.id_usuario, 'REPROGRAMAR_RESERVA', 'reserva', id);
        return this.findOne(id);
    }

    async confirmAttendance(id: number, dto: AttendanceDto, user: User) {
        const r = await this.findOne(id);
        if (r.id_usuario !== user.id_usuario)
            throw new ForbiddenException('No puedes confirmar asistencia de otra reserva');
        if (r.estado !== ReservaEstado.ACTIVA)
            throw new BadRequestException('Solo puedes confirmar asistencia en reservas activas');

        await this.repo.update(id, {
            asistencia: dto.asistencia,
            fecha_asistencia: new Date(),
            estado: ReservaEstado.COMPLETADA,
        });

        await this.historialSvc.log(
            user.id_usuario,
            dto.asistencia ? 'CONFIRMAR_ASISTENCIA' : 'REPORTAR_INASISTENCIA',
            'reserva',
            id,
        );
        return { message: 'Asistencia registrada correctamente' };
    }

    private normalizeTime(time: string): string {
        return time.length === 5 ? `${time}:00` : time;
    }

    async getPublicEvents() {
        const reservas = await this.repo.createQueryBuilder('r')
            .select(['r.fecha_uso', 'r.hora_inicio', 'r.hora_fin', 'r.estado', 'r.id_centro'])
            .where('r.estado IN (:...estados)', { estados: [ReservaEstado.ACTIVA, ReservaEstado.COMPLETADA] })
            .getMany();

        const solicitudes = await this.solicitudRepo.createQueryBuilder('s')
            .select(['s.fecha_uso', 's.hora_inicio', 's.hora_fin', 's.estado', 's.id_centro'])
            .where('s.estado = :estado', { estado: SolicitudEstado.PENDIENTE })
            .getMany();

        return [...reservas, ...solicitudes];
    }
}
