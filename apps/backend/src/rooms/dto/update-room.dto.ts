import { IsString, IsOptional, IsNotEmpty, Matches } from 'class-validator';

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'Capacity must be a number' })
  capacity?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  location?: string;
}