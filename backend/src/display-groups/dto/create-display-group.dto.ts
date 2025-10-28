import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateDisplayGroupDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  displayIds?: string[];
}
