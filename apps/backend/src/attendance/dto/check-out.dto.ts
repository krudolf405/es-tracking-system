import { IsUUID, IsNotEmpty } from 'class-validator';

export class CheckOutDto {
  @IsUUID()
  @IsNotEmpty()
  examSessionId!: string;

  @IsUUID()
  @IsNotEmpty()
  studentId!: string;
}
