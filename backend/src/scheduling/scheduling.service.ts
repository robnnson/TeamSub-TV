import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Between } from 'typeorm';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Schedule } from './entities/schedule.entity';
import { DisplayGroup } from '../display-groups/entities/display-group.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import * as cron from 'cron-parser';

@Injectable()
export class SchedulingService implements OnModuleInit {
  constructor(
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
    @InjectRepository(DisplayGroup)
    private displayGroupRepository: Repository<DisplayGroup>,
    @InjectQueue('content-schedule')
    private scheduleQueue: Queue,
    private eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    // Initialize active schedules on startup
    await this.initializeActiveSchedules();
  }

  /**
   * Create a new schedule
   */
  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    const { displayId, displayGroupId, contentId, contentIds, playlistId, startTime, endTime, recurrenceRule, priority, isActive } = createScheduleDto;

    // Validate that either displayId or displayGroupId is provided
    if (!displayId && !displayGroupId) {
      throw new BadRequestException('Either displayId or displayGroupId must be provided');
    }

    // Validate that either contentId, contentIds, or playlistId is provided
    if (!contentId && (!contentIds || contentIds.length === 0) && !playlistId) {
      throw new BadRequestException('Either contentId, contentIds, or playlistId must be provided');
    }

    // Validate date range
    if (endTime && new Date(startTime) >= new Date(endTime)) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Validate cron expression if provided
    if (recurrenceRule) {
      try {
        cron.parseExpression(recurrenceRule);
      } catch (error) {
        throw new BadRequestException(`Invalid cron expression: ${error.message}`);
      }
    }

    const schedule = this.scheduleRepository.create({
      displayId: displayId || null,
      displayGroupId: displayGroupId || null,
      contentId: contentId || null,
      contentIds: contentIds || null,
      playlistId: playlistId || null,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      recurrenceRule,
      priority: priority ?? 0,
      isActive: isActive ?? true,
    });

    const saved = await this.scheduleRepository.save(schedule);

    // Queue the schedule job
    if (saved.isActive) {
      await this.queueSchedule(saved);
    }

    // Emit event
    this.eventEmitter.emit('schedule.created', { schedule: saved });

    return this.findById(saved.id);
  }

  /**
   * Find all schedules
   * If displayId is provided, returns schedules for that display AND any groups it belongs to
   */
  async findAll(displayId?: string): Promise<Schedule[]> {
    const query = this.scheduleRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.display', 'display')
      .leftJoinAndSelect('schedule.displayGroup', 'displayGroup')
      .leftJoinAndSelect('displayGroup.displays', 'groupDisplays')
      .leftJoinAndSelect('schedule.content', 'content')
      .leftJoinAndSelect('schedule.playlist', 'playlist')
      .orderBy('schedule.startTime', 'ASC')
      .addOrderBy('schedule.priority', 'DESC');

    if (displayId) {
      // Include both direct schedules AND group schedules
      query.where(
        '(schedule.displayId = :displayId OR groupDisplays.id = :displayId)',
        { displayId }
      );
    }

    return query.getMany();
  }

  /**
   * Find active schedules for a display
   * This includes both:
   * 1. Schedules directly assigned to the display
   * 2. Schedules assigned to groups the display belongs to
   */
  async findActiveForDisplay(displayId: string): Promise<Schedule[]> {
    const now = new Date();

    const query = this.scheduleRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.display', 'display')
      .leftJoinAndSelect('schedule.displayGroup', 'displayGroup')
      .leftJoinAndSelect('displayGroup.displays', 'groupDisplays')
      .leftJoinAndSelect('schedule.content', 'content')
      .leftJoinAndSelect('schedule.playlist', 'playlist')
      .where('schedule.isActive = :isActive', { isActive: true })
      .andWhere('schedule.startTime <= :now', { now })
      .andWhere(
        '(schedule.displayId = :displayId OR groupDisplays.id = :displayId)',
        { displayId }
      )
      .orderBy('schedule.priority', 'DESC')
      .addOrderBy('schedule.startTime', 'ASC');

    return query.getMany();
  }

  /**
   * Find current active content for a display
   * This includes both direct schedules and group schedules
   */
  async getCurrentContent(displayId: string): Promise<Schedule | null> {
    const now = new Date();

    // Find schedules that are currently active (direct or via group)
    const query = this.scheduleRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.display', 'display')
      .leftJoinAndSelect('schedule.displayGroup', 'displayGroup')
      .leftJoinAndSelect('displayGroup.displays', 'groupDisplays')
      .leftJoinAndSelect('schedule.content', 'content')
      .leftJoinAndSelect('schedule.playlist', 'playlist')
      .where('schedule.isActive = :isActive', { isActive: true })
      .andWhere('schedule.startTime <= :now', { now })
      .andWhere(
        '(schedule.displayId = :displayId OR groupDisplays.id = :displayId)',
        { displayId }
      )
      .orderBy('schedule.priority', 'DESC')
      .addOrderBy('schedule.startTime', 'DESC');

    const schedules = await query.getMany();

    // Filter by endTime if specified
    const activeSchedules = schedules.filter(schedule => {
      if (!schedule.endTime) return true; // No end time means always active
      return schedule.endTime >= now;
    });

    // Return highest priority schedule
    return activeSchedules.length > 0 ? activeSchedules[0] : null;
  }

  /**
   * Find schedule by ID
   */
  async findById(id: string): Promise<Schedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['display', 'displayGroup', 'content', 'playlist'],
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return schedule;
  }

  /**
   * Update a schedule
   */
  async update(id: string, updateScheduleDto: UpdateScheduleDto): Promise<Schedule> {
    const schedule = await this.findById(id);

    const { startTime, endTime, recurrenceRule, priority, isActive } = updateScheduleDto;

    // Validate date range if both provided
    if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Validate cron expression if provided
    if (recurrenceRule) {
      try {
        cron.parseExpression(recurrenceRule);
      } catch (error) {
        throw new BadRequestException(`Invalid cron expression: ${error.message}`);
      }
    }

    // Update fields
    if (startTime) schedule.startTime = new Date(startTime);
    if (endTime !== undefined) schedule.endTime = endTime ? new Date(endTime) : null;
    if (recurrenceRule !== undefined) schedule.recurrenceRule = recurrenceRule;
    if (priority !== undefined) schedule.priority = priority;
    if (isActive !== undefined) schedule.isActive = isActive;

    const saved = await this.scheduleRepository.save(schedule);

    // Re-queue if active, remove if inactive
    if (saved.isActive) {
      await this.removeScheduleJob(saved.id);
      await this.queueSchedule(saved);
    } else {
      await this.removeScheduleJob(saved.id);
    }

    // Emit event
    this.eventEmitter.emit('schedule.updated', { schedule: saved });

    return this.findById(saved.id);
  }

  /**
   * Delete a schedule
   */
  async remove(id: string): Promise<void> {
    const schedule = await this.findById(id);

    // Remove from queue
    await this.removeScheduleJob(id);

    await this.scheduleRepository.remove(schedule);

    // Emit event
    this.eventEmitter.emit('schedule.deleted', { scheduleId: id });
  }

  /**
   * Get statistics
   */
  async getStats() {
    const [total, active, inactive] = await Promise.all([
      this.scheduleRepository.count(),
      this.scheduleRepository.count({ where: { isActive: true } }),
      this.scheduleRepository.count({ where: { isActive: false } }),
    ]);

    return {
      total,
      active,
      inactive,
    };
  }

  /**
   * Queue a schedule job
   * If the schedule targets a group, creates jobs for each display in the group
   */
  private async queueSchedule(schedule: Schedule): Promise<void> {
    const now = new Date();
    const startTime = new Date(schedule.startTime);

    // Calculate delay
    let delay = startTime.getTime() - now.getTime();
    if (delay < 0) delay = 0; // Already past start time, trigger immediately

    // If this is a group schedule, queue jobs for each display in the group
    if (schedule.displayGroupId) {
      const group = await this.displayGroupRepository.findOne({
        where: { id: schedule.displayGroupId },
        relations: ['displays'],
      });

      if (group && group.displays) {
        // Create a job for each display in the group
        for (const display of group.displays) {
          await this.scheduleQueue.add(
            'trigger-content',
            {
              scheduleId: schedule.id,
              displayId: display.id,
              contentId: schedule.contentId,
            },
            {
              jobId: `${schedule.id}-${display.id}`,
              delay,
              removeOnComplete: true,
              removeOnFail: false,
            },
          );
        }
      }
    } else {
      // Single display schedule
      await this.scheduleQueue.add(
        'trigger-content',
        {
          scheduleId: schedule.id,
          displayId: schedule.displayId,
          contentId: schedule.contentId,
        },
        {
          jobId: schedule.id,
          delay,
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    }

    // If recurring, also schedule the next occurrence
    if (schedule.recurrenceRule) {
      await this.scheduleRecurringJob(schedule);
    }
  }

  /**
   * Schedule recurring job based on cron expression
   * If the schedule targets a group, creates recurring jobs for each display
   */
  private async scheduleRecurringJob(schedule: Schedule): Promise<void> {
    if (!schedule.recurrenceRule) return;

    try {
      const interval = cron.parseExpression(schedule.recurrenceRule);
      const nextRun = interval.next().toDate();

      // If this is a group schedule, create recurring jobs for each display
      if (schedule.displayGroupId) {
        const group = await this.displayGroupRepository.findOne({
          where: { id: schedule.displayGroupId },
          relations: ['displays'],
        });

        if (group && group.displays) {
          for (const display of group.displays) {
            await this.scheduleQueue.add(
              'recurring-content',
              {
                scheduleId: schedule.id,
                displayId: display.id,
                contentId: schedule.contentId,
              },
              {
                jobId: `${schedule.id}-${display.id}-recurring`,
                repeat: {
                  pattern: schedule.recurrenceRule,
                },
                removeOnComplete: true,
                removeOnFail: false,
              },
            );
          }
        }
      } else {
        // Single display recurring job
        await this.scheduleQueue.add(
          'recurring-content',
          {
            scheduleId: schedule.id,
            displayId: schedule.displayId,
            contentId: schedule.contentId,
          },
          {
            jobId: `${schedule.id}-recurring`,
            repeat: {
              pattern: schedule.recurrenceRule,
            },
            removeOnComplete: true,
            removeOnFail: false,
          },
        );
      }
    } catch (error) {
      console.error(`Failed to schedule recurring job for schedule ${schedule.id}:`, error);
    }
  }

  /**
   * Remove a schedule job from the queue
   * For group schedules, removes jobs for all displays in the group
   */
  private async removeScheduleJob(scheduleId: string): Promise<void> {
    try {
      const schedule = await this.scheduleRepository.findOne({
        where: { id: scheduleId },
        relations: ['displayGroup', 'displayGroup.displays'],
      });

      if (schedule && schedule.displayGroupId && schedule.displayGroup) {
        // Group schedule - remove jobs for each display
        for (const display of schedule.displayGroup.displays || []) {
          const job = await this.scheduleQueue.getJob(`${scheduleId}-${display.id}`);
          if (job) {
            await job.remove();
          }

          const recurringJob = await this.scheduleQueue.getJob(`${scheduleId}-${display.id}-recurring`);
          if (recurringJob) {
            await recurringJob.remove();
          }
        }
      } else {
        // Single display schedule
        const job = await this.scheduleQueue.getJob(scheduleId);
        if (job) {
          await job.remove();
        }

        const recurringJob = await this.scheduleQueue.getJob(`${scheduleId}-recurring`);
        if (recurringJob) {
          await recurringJob.remove();
        }
      }
    } catch (error) {
      console.error(`Failed to remove schedule job ${scheduleId}:`, error);
    }
  }

  /**
   * Initialize all active schedules on startup
   */
  private async initializeActiveSchedules(): Promise<void> {
    const activeSchedules = await this.scheduleRepository.find({
      where: { isActive: true },
    });

    console.log(`Initializing ${activeSchedules.length} active schedules...`);

    for (const schedule of activeSchedules) {
      try {
        await this.queueSchedule(schedule);
      } catch (error) {
        console.error(`Failed to queue schedule ${schedule.id}:`, error);
      }
    }

    console.log('Schedule initialization complete');
  }
}
