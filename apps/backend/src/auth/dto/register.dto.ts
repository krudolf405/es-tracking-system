import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(['ADMIN', 'LECTURER', 'INVIGILATOR', 'STUDENT'])
  role!: 'ADMIN' | 'LECTURER' | 'INVIGILATOR' | 'STUDENT';
}
