import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ContentService } from './content.service';

@Injectable()
export class ContentTasksService {
  private readonly logger = new Logger(ContentTasksService.name);

  constructor(private readonly contentService: ContentService) {}

  // Run every hour to archive expired content
  @Cron(CronExpression.EVERY_HOUR)
  async archiveExpiredContent() {
    this.logger.log('Running scheduled task: archiveExpiredContent');

    try {
      const count = await this.contentService.archiveExpiredContent();

      if (count > 0) {
        this.logger.log(`Archived ${count} expired content item(s)`);
      } else {
        this.logger.debug('No expired content to archive');
      }
    } catch (error) {
      this.logger.error('Failed to archive expired content', error.stack);
    }
  }
}
