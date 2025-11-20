import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from './entities/content.entity';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { ContentTasksService } from './content-tasks.service';
import { ThumbnailService } from './thumbnail.service';
import { Display } from '../displays/entities/display.entity';
import { FlexibleAuthGuard } from '../common/guards/flexible-auth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DisplayApiKeyGuard } from '../sse/guards/display-api-key.guard';
import { EncryptionService } from '../common/services/encryption.service';

@Module({
  imports: [TypeOrmModule.forFeature([Content, Display])],
  controllers: [ContentController],
  providers: [
    ContentService,
    ContentTasksService,
    ThumbnailService,
    FlexibleAuthGuard,
    JwtAuthGuard,
    DisplayApiKeyGuard,
    EncryptionService,
  ],
  exports: [ContentService],
})
export class ContentModule {}
