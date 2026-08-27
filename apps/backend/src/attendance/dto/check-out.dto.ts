import { IsUUID, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CheckOutDto {
  @IsUUID()
  @IsNotEmpty()
  examSessionId!: string;

  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  qrCodeHash?: string;
}
