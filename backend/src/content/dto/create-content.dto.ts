import { IsString, IsEnum, IsOptional, IsNumber, IsObject, Min, IsDateString } from 'class-validator';
import { ContentType } from '../entities/content.entity';

export class CreateContentDto {
  @IsString()
  title: string;

  @IsEnum(ContentType)
  @IsOptional()
  type?: ContentType;

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
