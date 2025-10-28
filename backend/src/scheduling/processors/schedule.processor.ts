import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface ScheduleJobData {
  scheduleId: string;
  displayId: string;
  contentId: string;
}

@Processor('content-schedule')
export class ScheduleProcessor extends WorkerHost {
  private readonly logger = new Logger(ScheduleProcessor.name);

  constructor(private eventEmitter: EventEmitter2) {
    super();
  }

  async process(job: Job<ScheduleJobData>): Promise<void> {
    const { scheduleId, displayId, contentId } = job.data;

    this.logger.log(
      `Processing scheduled content: Schedule ${scheduleId}, Display ${displayId}, Content ${contentId}`,
    );

    try {
      // Emit event for SSE to pick up
      this.eventEmitter.emit('schedule.triggered', {
        scheduleId,
        displayId,
        contentId,
        triggeredAt: new Date(),
      });

      // Emit display-specific event
      this.eventEmitter.emit(`display.${displayId}.content.changed`, {
        contentId,
        source: 'schedule',
        scheduleId,
      });

      this.logger.log(`Successfully triggered schedule ${scheduleId}`);
    } catch (error) {
      this.logger.error(`Failed to process schedule ${scheduleId}:`, error);
      throw error;
    }
  }
}
