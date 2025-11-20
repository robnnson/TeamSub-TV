import { IsString, IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class CreateReleaseNoteDto {
  @IsString()
  version: string;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsDateString()
  releaseDate: string;

  @IsBoolean()
  @IsOptional()
  isMajor?: boolean;
}
