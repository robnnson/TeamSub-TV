import { IsString, IsIn, IsBoolean } from 'class-validator';

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

export class UpdateDisplayFeaturesDto {
  @IsBoolean()
  showTicker?: boolean;

  @IsBoolean()
  showRotatingCards?: boolean;

  @IsBoolean()
  showMetroCard?: boolean;

  @IsBoolean()
  showStatusCard?: boolean;

  @IsBoolean()
  showDrivingCard?: boolean;

  @IsBoolean()
  showBikeshareCard?: boolean;

  @IsBoolean()
  showNewsHeadlines?: boolean;
}
