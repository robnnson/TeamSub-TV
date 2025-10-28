import { IsString, IsIn } from 'class-validator';

export class UpdateFpconDto {
  @IsString()
  @IsIn(['NORMAL', 'ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'])
  status: string;
}

export class UpdateLanDto {
  @IsString()
  @IsIn(['NORMAL', 'DEGRADED', 'OUTAGE'])
  status: string;
}

export class UpdateApiKeyDto {
  @IsString()
  apiKey: string;
}
