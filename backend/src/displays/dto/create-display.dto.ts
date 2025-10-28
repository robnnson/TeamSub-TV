import { IsString, IsOptional } from 'class-validator';

export class CreateDisplayDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  pairingCode?: string;
}
