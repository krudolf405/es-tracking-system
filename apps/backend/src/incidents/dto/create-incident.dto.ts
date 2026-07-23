import { IsString, IsUUID, IsOptional, IsIn, MinLength, MaxLength } from 'class-validator';

const INCIDENT_TYPES = ['MALPRACTICE', 'UNAUTHORIZED_ENTRY', 'TECHNICAL_ISSUE', 'OTHER'] as const;

export class CreateIncidentDto {
  @IsUUID()
  examSessionId!: string;

  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsIn(INCIDENT_TYPES)
  type!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  description!: string;
}
