import { IsString, IsOptional, IsNumber, IsObject, Min, IsDateString } from 'class-validator';

export class UpdateContentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  textContent?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsNumber()
  @Min(1)
  @IsOptional()
  duration?: number;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
