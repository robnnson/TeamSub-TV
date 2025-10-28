import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Schedule } from './entities/schedule.entity';
import { SchedulingService } from './scheduling.service';
import { SchedulingController } from './scheduling.controller';
import { ScheduleProcessor } from './processors/schedule.processor';
import { Display } from '../displays/entities/display.entity';
import { FlexibleAuthGuard } from '../common/guards/flexible-auth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DisplayApiKeyGuard } from '../sse/guards/display-api-key.guard';
import { EncryptionService } from '../common/services/encryption.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Schedule, Display]),
    BullModule.registerQueue({
      name: 'content-schedule',
    }),
  ],
  controllers: [SchedulingController],
  providers: [
    SchedulingService,
    ScheduleProcessor,
    FlexibleAuthGuard,
    JwtAuthGuard,
    DisplayApiKeyGuard,
    EncryptionService,
  ],
  exports: [SchedulingService],
})
export class SchedulingModule {}
