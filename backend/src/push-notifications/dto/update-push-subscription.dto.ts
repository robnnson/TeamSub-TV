import { IsObject, IsOptional, IsBoolean } from 'class-validator';

export class UpdatePushSubscriptionDto {
  @IsOptional()
  @IsObject()
  preferences?: {
    displayOffline?: boolean;
    displayOnline?: boolean;
    highErrors?: boolean;
    lowUptime?: boolean;
    performanceIssues?: boolean;
  };

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
