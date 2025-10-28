import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlaylistItemDto)
  items: PlaylistItemDto[];
}
