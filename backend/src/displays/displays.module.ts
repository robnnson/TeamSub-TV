import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Display } from './entities/display.entity';
import { DisplaysService } from './displays.service';
import { DisplaysController } from './displays.controller';
import { DisplaysPublicController } from './displays-public.controller';
import { DisplayApiKeyGuard } from '../sse/guards/display-api-key.guard';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { ContentModule } from '../content/content.module';
import { SettingsModule } from '../settings/settings.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Display]),
    forwardRef(() => SchedulingModule),
    forwardRef(() => ContentModule),
    forwardRef(() => SettingsModule),
    CommonModule,
  ],
  controllers: [DisplaysController, DisplaysPublicController],
  providers: [DisplaysService, DisplayApiKeyGuard],
  exports: [DisplaysService],
})
export class DisplaysModule {}
