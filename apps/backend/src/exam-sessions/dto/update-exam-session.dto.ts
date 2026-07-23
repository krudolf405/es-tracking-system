import {
  IsString,
  IsUUID,
  IsArray,
  IsOptional,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';

enum SessionStatus {
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class UpdateExamSessionDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  courseName?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  courseCode?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  date?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  endTime?: string;

  @IsUUID()
  @IsOptional()
  roomId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  invigilatorIds?: string[];

  @IsEnum(SessionStatus)
  @IsOptional()
  status?: SessionStatus;
}
