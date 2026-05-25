// src/auth/dto/register.dto.ts
import {
  IsEmail, IsString, IsEnum,
  MinLength, MaxLength, Matches,
} from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Le mot de passe doit contenir une majuscule, une minuscule et un chiffre',
  })
  password: string;

  @IsString()
  @MinLength(2, { message: 'Prénom trop court' })
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(2, { message: 'Nom trop court' })
  @MaxLength(50)
  lastName: string;

  @IsEnum(Role, { message: 'Rôle invalide : ARTIST ou CLIENT' })
  role: Role;
}
