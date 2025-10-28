import {
  IsUUID,
  IsDateString,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

export class CreateScheduleDto {
  @IsUUID()
  displayId: string;

  @IsUUID()
  contentId: string;

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
