import { IsArray, IsUUID, IsOptional } from 'class-validator';

export class AllocateOverflowDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  overflowRoomIds?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  invigilatorIds?: string[];
}
