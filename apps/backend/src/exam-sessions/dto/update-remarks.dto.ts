import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateRemarksDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  remarks!: string;
}
