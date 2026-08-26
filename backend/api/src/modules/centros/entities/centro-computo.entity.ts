import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Facultad } from '../../facultades/entities/facultad.entity';

@Entity('centro_computo')
export class CentroComputo {
    @PrimaryGeneratedColumn()
    id_centro: number;

    @Column({ length: 100 })
    nombre: string;

    @Column({ nullable: true })
    id_facultad: number;

    @Column({ type: 'smallint', default: 30 })
    capacidad: number;

    @Column({ type: 'text', nullable: true })
    descripcion: string;

    @Column({ default: true })
    activo: boolean;

    @Column({ default: false })
    es_general: boolean;

    @Column({ length: 15, nullable: true })
    telefono: string;

    @ManyToOne(() => Facultad, { eager: true, nullable: true })
    @JoinColumn({ name: 'id_facultad' })
    facultad: Facultad;

    @CreateDateColumn()
    created_at: Date;
}
