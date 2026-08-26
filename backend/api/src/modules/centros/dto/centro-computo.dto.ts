import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateCentroComputoDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    id_facultad: number;

    @IsOptional()
    @IsBoolean()
    es_general?: boolean;

    @IsString()
    @MinLength(3)
    nombre: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    capacidad: number;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsBoolean()
    activo?: boolean;

    @IsOptional()
    @IsString()
    telefono?: string;
}

export class UpdateCentroComputoDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    id_facultad?: number;

    @IsOptional()
    @IsBoolean()
    es_general?: boolean;

    @IsOptional()
    @IsString()
    @MinLength(3)
    nombre?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    capacidad?: number;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsBoolean()
    activo?: boolean;

    @IsOptional()
    @IsString()
    telefono?: string;
}
