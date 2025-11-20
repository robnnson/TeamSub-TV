import { IsString, IsObject, IsOptional, IsBoolean } from 'class-validator';

export class CreatePushSubscriptionDto {
  @IsString()
  endpoint: string;

  @IsObject()
  keys: {
    p256dh: string;
    auth: string;
  };

  @IsOptional()
  @IsObject()
  preferences?: {
    displayOffline?: boolean;
    displayOnline?: boolean;
    highErrors?: boolean;
    lowUptime?: boolean;
    performanceIssues?: boolean;
  };
}
