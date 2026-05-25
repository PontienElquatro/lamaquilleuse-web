// src/users/dto/update-profile.dto.ts
import {
  IsString, IsOptional, IsUrl, IsInt,
  MaxLength, MinLength, Min, Max, IsArray,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  yearsOfExp?: number;

  @IsOptional()
  @IsUrl({}, { message: 'URL Instagram invalide' })
  instagramUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'URL site web invalide' })
  websiteUrl?: string;
}
