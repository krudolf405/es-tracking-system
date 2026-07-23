import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CheckInDto {
  @IsUUID()
  @IsNotEmpty()
  examSessionId!: string;

  @IsString()
  @IsNotEmpty()
  qrCodeHash!: string;
}
