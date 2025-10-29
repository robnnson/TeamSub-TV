import { IsString, IsOptional, IsEnum } from 'class-validator';
import { LayoutType } from '../types/layout-type.enum';

export class UpdateDisplayDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(LayoutType)
  @IsOptional()
  layoutType?: LayoutType;
}
