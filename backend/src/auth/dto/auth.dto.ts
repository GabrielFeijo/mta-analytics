import { Transform } from 'class-transformer';
import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

const normalizeEmail = ({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value;

const trimString = ({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value;

export class LoginDto {
    @Transform(normalizeEmail)
    @IsEmail()
    @MaxLength(160)
    email: string;

    @IsString()
    @MinLength(6)
    @MaxLength(72)
    password: string;
}

export class RegisterDto {
    @Transform(trimString)
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(40)
    username: string;

    @Transform(normalizeEmail)
    @IsEmail()
    @MaxLength(160)
    email: string;

    @IsString()
    @MinLength(6)
    @MaxLength(72)
    password: string;
}

export class CreateOperatorDto extends RegisterDto {
    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}

export class UpdateOperatorRoleDto {
    @IsEnum(Role)
    role: Role;
}
