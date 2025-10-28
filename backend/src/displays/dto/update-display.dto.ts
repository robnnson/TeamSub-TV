import { IsString, IsOptional } from 'class-validator';

export class UpdateDisplayDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  location?: string;
}
