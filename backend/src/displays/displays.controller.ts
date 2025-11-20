import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  SetMetadata,
  Res,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { DisplaysService } from './displays.service';
import { CreateDisplayDto } from './dto/create-display.dto';
import { UpdateDisplayDto } from './dto/update-display.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { DisplayApiKeyGuard } from '../sse/guards/display-api-key.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SchedulingService } from '../scheduling/scheduling.service';
import { ContentService } from '../content/content.service';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import { pipeline } from 'stream/promises';

export const Public = () => SetMetadata('isPublic', true);

@Controller('displays')
export class DisplaysController {
  constructor(
    private readonly displaysService: DisplaysService,
    private readonly schedulingService: SchedulingService,
    private readonly contentService: ContentService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll() {
    return this.displaysService.findAll();
  }

  @Get('me')
  @UseGuards(DisplayApiKeyGuard)
  getMyInfo(@Request() req: any) {
    // The DisplayApiKeyGuard attaches the display to the request
    return req.display;
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getStats() {
    return this.displaysService.getStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOne(@Param('id') id: string) {
    return this.displaysService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createDisplayDto: CreateDisplayDto) {
    // Check if pairingCode is provided
    if (createDisplayDto.pairingCode) {
      return this.displaysService.createWithPairingCode(
        createDisplayDto.pairingCode,
        createDisplayDto.name,
        createDisplayDto.location,
        createDisplayDto.layoutType,
      );
    }

    return this.displaysService.create(
      createDisplayDto.name,
      createDisplayDto.location,
    );
  }

  @Post('generate-pairing-code')
  generatePairingCode() {
    // No auth required - displays can generate codes
    return this.displaysService.generatePairingCodeForDisplay();
  }

  @Get(':id/pairing-status')
  checkPairingStatus(@Param('id') id: string) {
    // No auth required - displays need to check if they've been paired
    return this.displaysService.checkPairingStatus(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateDisplayDto: UpdateDisplayDto,
  ) {
    return this.displaysService.update(
      id,
      updateDisplayDto.name,
      updateDisplayDto.location,
      updateDisplayDto.layoutType,
    );
  }

  @Post(':id/regenerate-key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  regenerateApiKey(@Param('id') id: string) {
    return this.displaysService.regenerateApiKey(id);
  }

  @Post(':id/heartbeat')
  @UseGuards(DisplayApiKeyGuard)
  async heartbeat(@Param('id') id: string, @Request() req: any) {
    // Verify the display making the request matches the ID in the URL
    if (req.display.id !== id) {
      throw new Error('Display ID mismatch');
    }
    await this.displaysService.heartbeat(id);
    return { message: 'Heartbeat recorded', timestamp: new Date() };
  }

  @Post(':id/debug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async toggleDebug(@Param('id') id: string, @Body() body: { enabled: boolean }) {
    await this.displaysService.toggleDebugOverlay(id, body.enabled);
    return { message: 'Debug overlay toggled', enabled: body.enabled };
  }

  @Get(':id/preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getPreview(@Param('id') id: string) {
    // Verify display exists
    await this.displaysService.findById(id);

    // Get current scheduled content
    const scheduledContent = await this.schedulingService.getCurrentContent(id);

    if (scheduledContent) {
      let content = scheduledContent.content;

      // If it's a playlist schedule, get the first item's content
      if (!content && scheduledContent.playlist?.items?.length > 0) {
        const firstItem = scheduledContent.playlist.items[0];
        if (firstItem.content) {
          content = firstItem.content;
        }
      }

      return {
        source: 'schedule',
        schedule: {
          id: scheduledContent.id,
          priority: scheduledContent.priority,
          startTime: scheduledContent.startTime,
          endTime: scheduledContent.endTime,
        },
        content: content,
        playlist: scheduledContent.playlist,
      };
    }

    // If no scheduled content, return latest content
    const allContent = await this.contentService.findAll();
    if (allContent && allContent.length > 0) {
      return {
        source: 'default',
        content: allContent[0],
      };
    }

    return null;
  }

  @Post(':id/screenshot/request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async requestScreenshot(@Param('id') id: string) {
    return this.displaysService.requestScreenshot(id);
  }

  @Post('me/screenshot')
  @UseGuards(DisplayApiKeyGuard)
  async uploadScreenshot(@Request() req: any, @Req() fastifyReq: FastifyRequest) {
    const display = req.display;

    try {
      const data = await fastifyReq.file();

      if (!data) {
        throw new BadRequestException('No file uploaded');
      }

      // Validate MIME type
      if (!data.mimetype.startsWith('image/')) {
        throw new BadRequestException('File must be an image');
      }

      // Generate filename
      const timestamp = Date.now();
      const ext = path.extname(data.filename) || '.png';
      const filename = `screenshot_${display.id}_${timestamp}${ext}`;

      // Save file to screenshots directory
      const mediaDir = process.env.MEDIA_DIR || path.join(process.cwd(), 'media');
      const screenshotDir = path.join(mediaDir, 'screenshots');

      // Ensure directory exists
      await fs.mkdir(screenshotDir, { recursive: true });

      const filePath = path.join(screenshotDir, filename);
      await pipeline(data.file, fsSync.createWriteStream(filePath));

      // Update display with screenshot info
      const relativePath = path.join('screenshots', filename);
      await this.displaysService.updateScreenshotPath(display.id, relativePath);

      return { message: 'Screenshot uploaded successfully', path: relativePath };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Screenshot upload failed: ' + error.message);
    }
  }

  @Get(':id/screenshot/latest')
  async getLatestScreenshot(@Param('id') id: string, @Res() res: FastifyReply) {
    const display = await this.displaysService.findById(id);

    if (!display.lastScreenshotPath) {
      throw new BadRequestException('No screenshot available for this display');
    }

    const mediaDir = process.env.MEDIA_DIR || path.join(process.cwd(), 'media');
    const screenshotFullPath = path.join(mediaDir, display.lastScreenshotPath);

    // Check if file exists
    try {
      await fs.access(screenshotFullPath);
    } catch {
      throw new BadRequestException('Screenshot file not found');
    }

    const ext = path.extname(screenshotFullPath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };

    res.header('Content-Type', mimeTypes[ext] || 'image/png');
    res.header('Cache-Control', 'no-cache');

    const fileStream = fsSync.createReadStream(screenshotFullPath);
    return res.send(fileStream);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.displaysService.remove(id);
    return { message: 'Display deleted successfully' };
  }

  // Health monitoring endpoints
  @Get(':id/health')
  @UseGuards(JwtAuthGuard)
  async getDisplayHealth(@Param('id') id: string) {
    return this.displaysService.getDisplayHealth(id);
  }

  @Get('monitoring/health-all')
  @UseGuards(JwtAuthGuard)
  async getAllDisplaysHealth() {
    return this.displaysService.getAllDisplaysHealth();
  }

  @Get('monitoring/alerts')
  @UseGuards(JwtAuthGuard)
  async getDisplayAlerts() {
    return this.displaysService.getDisplayAlerts();
  }

  @Post(':id/log-error')
  @UseGuards(DisplayApiKeyGuard)
  async logDisplayError(
    @Param('id') id: string,
    @Body() body: { message: string; severity?: 'low' | 'medium' | 'high' },
  ) {
    await this.displaysService.logDisplayError(id, body.message, body.severity);
    return { message: 'Error logged successfully' };
  }

  @Delete(':id/errors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async clearDisplayErrors(@Param('id') id: string) {
    await this.displaysService.clearDisplayErrors(id);
    return { message: 'Errors cleared successfully' };
  }
}
