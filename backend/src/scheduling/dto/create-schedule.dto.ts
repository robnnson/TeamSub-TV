import {
  IsUUID,
  IsDateString,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsArray,
  ValidateIf,
} from 'class-validator';

export class CreateScheduleDto {
  // Target either a single display or a display group
  @IsUUID()
  @ValidateIf((o) => !o.displayGroupId)
  @IsOptional()
  displayId?: string;

  @IsUUID()
  @ValidateIf((o) => !o.displayId)
  @IsOptional()
  displayGroupId?: string;

  // Single content - required if contentIds and playlistId not provided
  @IsUUID()
  @ValidateIf((o) => !o.contentIds && !o.playlistId)
  @IsOptional()
  contentId?: string;

  // Simple playlist - array of content IDs
  @IsArray()
  @IsUUID('4', { each: true })
  @ValidateIf((o) => !o.contentId && !o.playlistId)
  @IsOptional()
  contentIds?: string[];

  // Advanced playlist - reference to Playlist entity
  @IsUUID()
  @ValidateIf((o) => !o.contentId && !o.contentIds)
  @IsOptional()
  playlistId?: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  recurrenceRule?: string; // Cron expression (e.g., "0 9 * * 1-5" for 9am weekdays)

  @IsInt()
  @Min(0)
  @Max(999)
  @IsOptional()
  priority?: number; // 0-999, higher = more important

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
