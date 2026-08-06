import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'Capacity must be a number' })
  capacity!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;
}