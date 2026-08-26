import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
    @IsString()
    @MinLength(2)
    nombre: string;

    @IsString()
    @MinLength(2)
    apellido1: string;

    @IsOptional()
    @IsString()
    apellido2?: string;

    @IsEmail()
    @Matches(/^[a-zA-Z0-9._%+-]+@uas\.edu\.mx$/i, {
        message: 'Solo se permiten correos escolares @uas.edu.mx',
    })
    correo: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    @Matches(/^[0-9]{10}$/, {
        message: 'El teléfono debe tener 10 números',
    })
    telefono: string;

    @IsOptional()
    @IsString()
    facultad?: string;
}
