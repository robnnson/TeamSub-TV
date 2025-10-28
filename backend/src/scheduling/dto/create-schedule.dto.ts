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
  @IsUUID()
  displayId: string;

  // Single content (legacy) - required if contentIds not provided
  @IsUUID()
  @ValidateIf((o) => !o.contentIds || o.contentIds.length === 0)
  @IsOptional()
  contentId?: string;

  // Playlist - array of content IDs (new feature)
  @IsArray()
  @IsUUID('4', { each: true })
  @ValidateIf((o) => !o.contentId)
  @IsOptional()
  contentIds?: string[];

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
