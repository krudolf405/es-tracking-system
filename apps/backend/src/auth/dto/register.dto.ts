import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(['ADMIN', 'INVIGILATOR', 'STUDENT'])
  role!: 'ADMIN' | 'INVIGILATOR' | 'STUDENT';

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  matricNumber?: string;
}