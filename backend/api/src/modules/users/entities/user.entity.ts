import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
    PROFESOR = 'profesor',
    ADMIN = 'admin',
}

@Entity('usuario')
export class User {
    @PrimaryGeneratedColumn()
    id_usuario: number;

    @Column({ length: 50 })
    nombre: string;

    @Column({ length: 30 })
    apellido1: string;

    @Column({ length: 30, nullable: true })
    apellido2: string;

    @Column({ length: 100, unique: true })
    correo: string;

    @Exclude()
    @Column({ length: 255, name: 'password_hash', select: false })
    password_hash: string;

    @Column({ length: 15, nullable: true })
    telefono: string;

    @Column({ length: 100, nullable: true })
    facultad: string;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.PROFESOR })
    rol: UserRole;

    @Column({ default: true })
    activo: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
