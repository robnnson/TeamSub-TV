import { IsString, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class PlaylistItemDto {
  @IsString()
  contentId: string;

  @IsOptional()
  durationOverride?: number;
}

export class CreatePlaylistDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  loop?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlaylistItemDto)
  items: PlaylistItemDto[];
}
