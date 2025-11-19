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
} from '@nestjs/common';
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.displaysService.remove(id);
    return { message: 'Display deleted successfully' };
  }
}
