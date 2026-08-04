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

  @IsEnum(['ADMIN', 'LECTURER', 'INVIGILATOR', 'STUDENT'])
  role!: 'ADMIN' | 'LECTURER' | 'INVIGILATOR' | 'STUDENT';

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  matricNumber?: string;
}