import { IsString, IsOptional, IsEnum } from 'class-validator';
import { LayoutType } from '../types/layout-type.enum';

export class CreateDisplayDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  pairingCode?: string;

  @IsEnum(LayoutType)
  @IsOptional()
  layoutType?: LayoutType;
}
