import { IsString, IsUUID, IsArray, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateExamSessionDto {
  @IsString()
  @IsNotEmpty()
  courseName!: string;

  @IsString()
  @IsNotEmpty()
  courseCode!: string;

  @IsString()
  @IsNotEmpty()
  date!: string;

  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @IsString()
  @IsNotEmpty()
  endTime!: string;

  @IsUUID()
  roomId!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  invigilatorIds?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  overflowRoomIds?: string[];
}
