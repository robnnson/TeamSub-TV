import { IsString, IsOptional, IsArray, IsUUID, IsEnum } from 'class-validator';
import { LayoutType } from '../../displays/types/layout-type.enum';

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

  @IsEnum(LayoutType)
  @IsOptional()
  layoutType?: LayoutType;
}
