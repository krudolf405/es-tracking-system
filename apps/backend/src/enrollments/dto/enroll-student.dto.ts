import { IsString, IsNotEmpty, IsArray, IsOptional, IsUUID } from 'class-validator';

export class EnrollStudentDto {
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  studentIds?: string[];

  @IsString()
  @IsNotEmpty()
  courseCode!: string;
}
