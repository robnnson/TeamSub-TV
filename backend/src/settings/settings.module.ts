import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from './entities/setting.entity';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { FlexibleAuthGuard } from '../common/guards/flexible-auth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DisplayApiKeyGuard } from '../sse/guards/display-api-key.guard';
import { EncryptionService } from '../common/services/encryption.service';
import { Display } from '../displays/entities/display.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Setting, Display])],
  controllers: [SettingsController],
  providers: [
    SettingsService,
    FlexibleAuthGuard,
    JwtAuthGuard,
    DisplayApiKeyGuard,
    EncryptionService,
  ],
  exports: [SettingsService],
})
export class SettingsModule {}
