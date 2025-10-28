import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { DisplaysService } from './displays.service';
import { SchedulingService } from '../scheduling/scheduling.service';
import { ContentService } from '../content/content.service';
import { SettingsService } from '../settings/settings.service';
import { DisplayApiKeyGuard } from '../sse/guards/display-api-key.guard';

/**
 * Public API for displays
 * All endpoints require display API key authentication
 */
@Controller('public/display')
@UseGuards(DisplayApiKeyGuard)
export class DisplaysPublicController {
  constructor(
    private readonly displaysService: DisplaysService,
    private readonly schedulingService: SchedulingService,
    private readonly contentService: ContentService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Get display configuration and settings
   */
  @Get('config')
  async getConfig(@Req() request: any) {
    const display = request.display;

    // Get all relevant settings
    const [
      fpconStatus,
      lanStatus,
      weatherApiKey,
      weatherLocation,
      metroApiKey,
      metroStations,
      drivingDestinations,
      displayInterval,
    ] = await Promise.all([
      this.settingsService.getFpconStatus(),
      this.settingsService.getLanStatus(),
      this.settingsService.getApiKey('openweather').catch(() => null),
      this.settingsService.getValue('weather_location').catch(() => null),
      this.settingsService.getApiKey('wmata').catch(() => null),
      this.settingsService.getValue('metro_stations').catch(() => null),
      this.settingsService.getValue('driving_destinations').catch(() => null),
      this.settingsService.getValue('display_interval').catch(() => '10'),
    ]);

    return {
      display: {
        id: display.id,
        name: display.name,
        location: display.location,
      },
      settings: {
        fpconStatus,
        lanStatus,
        displayInterval: parseInt(displayInterval, 10),
      },
      integrations: {
        weather: {
          enabled: !!weatherApiKey,
          apiKey: weatherApiKey,
          location: weatherLocation,
        },
        metro: {
          enabled: !!metroApiKey,
          apiKey: metroApiKey,
          stations: metroStations ? JSON.parse(metroStations) : [],
        },
        driving: {
          enabled: !!drivingDestinations,
          destinations: drivingDestinations ? JSON.parse(drivingDestinations) : [],
        },
      },
    };
  }

  /**
   * Get current content for this display
   * Returns the highest priority scheduled content or default content
   */
  @Get('content/current')
  async getCurrentContent(@Req() request: any) {
    const display = request.display;

    // Check for scheduled content first
    const scheduledContent = await this.schedulingService.getCurrentContent(display.id);

    if (scheduledContent) {
      return {
        source: 'schedule',
        schedule: {
          id: scheduledContent.id,
          priority: scheduledContent.priority,
          startTime: scheduledContent.startTime,
          endTime: scheduledContent.endTime,
        },
        content: scheduledContent.content,
      };
    }

    // If no scheduled content, return latest content
    const allContent = await this.contentService.findAll();
    const latestContent = allContent.length > 0 ? allContent[0] : null;

    return {
      source: 'default',
      content: latestContent,
    };
  }

  /**
   * Get all available content for this display
   */
  @Get('content')
  async getAllContent(@Req() request: any) {
    const display = request.display;

    const content = await this.contentService.findAll();

    return {
      displayId: display.id,
      displayName: display.name,
      content,
      total: content.length,
    };
  }

  /**
   * Get active schedules for this display
   */
  @Get('schedules')
  async getSchedules(@Req() request: any) {
    const display = request.display;

    const schedules = await this.schedulingService.findActiveForDisplay(display.id);

    return {
      displayId: display.id,
      schedules,
      total: schedules.length,
    };
  }

  /**
   * Send heartbeat to indicate display is online
   */
  @Post('heartbeat')
  async heartbeat(@Req() request: any) {
    const display = request.display;

    await this.displaysService.heartbeat(display.id);

    return {
      displayId: display.id,
      status: 'online',
      timestamp: new Date().toISOString(),
      message: 'Heartbeat received',
    };
  }

  /**
   * Get FPCON status
   */
  @Get('status/fpcon')
  async getFpconStatus() {
    const status = await this.settingsService.getFpconStatus();
    return {
      status,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get LAN status
   */
  @Get('status/lan')
  async getLanStatus() {
    const status = await this.settingsService.getLanStatus();
    return {
      status,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get display info (self-identification)
   */
  @Get('info')
  async getDisplayInfo(@Req() request: any) {
    const display = request.display;

    return {
      id: display.id,
      name: display.name,
      location: display.location,
      status: display.status,
      lastSeen: display.lastSeen,
      createdAt: display.createdAt,
    };
  }
}
