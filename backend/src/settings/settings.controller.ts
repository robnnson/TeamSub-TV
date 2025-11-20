import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UpdateFpconDto, UpdateLanDto, UpdateApiKeyDto, UpdateDisplayFeaturesDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FlexibleAuthGuard } from '../common/guards/flexible-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

export const Public = () => SetMetadata('isPublic', true);

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createSettingDto: CreateSettingDto) {
    return this.settingsService.create(
      createSettingDto.key,
      createSettingDto.value,
      createSettingDto.isEncrypted,
      createSettingDto.description,
    );
  }

  @Patch(':key')
  @Roles(UserRole.ADMIN)
  update(
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
  ) {
    return this.settingsService.update(
      key,
      updateSettingDto.value,
      updateSettingDto.description,
    );
  }

  @Delete(':key')
  @Roles(UserRole.ADMIN)
  remove(@Param('key') key: string) {
    return this.settingsService.remove(key);
  }

  // Special endpoints for common settings

  @Public()
  @Get('status/fpcon')
  async getFpcon() {
    // Public endpoint - no authentication required
    const status = await this.settingsService.getFpconStatus();
    return { status };
  }

  @Patch('status/fpcon')
  @Roles(UserRole.ADMIN)
  async updateFpcon(@Body() dto: UpdateFpconDto) {
    await this.settingsService.setFpconStatus(dto.status);
    return { status: dto.status, message: 'FPCON status updated successfully' };
  }

  @Public()
  @Get('status/lan')
  async getLan() {
    // Public endpoint - no authentication required
    const status = await this.settingsService.getLanStatus();
    return { status };
  }

  @Patch('status/lan')
  @Roles(UserRole.ADMIN)
  async updateLan(@Body() dto: UpdateLanDto) {
    await this.settingsService.setLanStatus(dto.status);
    return { status: dto.status, message: 'LAN status updated successfully' };
  }

  @Public()
  @Get('ticker_messages')
  async getTickerMessages() {
    // Public endpoint - no authentication required for displays
    return this.settingsService.findByKey('ticker_messages');
  }

  @Get('apikeys/:service')
  @Roles(UserRole.ADMIN)
  async getApiKey(@Param('service') service: string) {
    const apiKey = await this.settingsService.getApiKey(service);
    return { service, apiKey };
  }

  @Patch('apikeys/:service')
  @Roles(UserRole.ADMIN)
  async updateApiKey(
    @Param('service') service: string,
    @Body() dto: UpdateApiKeyDto,
  ) {
    await this.settingsService.setApiKey(service, dto.apiKey);
    return { service, message: 'API key updated successfully' };
  }

  // Display Features Settings
  @Public()
  @Get('display/features')
  async getDisplayFeatures() {
    const showTicker = await this.settingsService.getDisplayFeature('show_ticker');
    const showRotatingCards = await this.settingsService.getDisplayFeature('show_rotating_cards');
    const showMetroCard = await this.settingsService.getDisplayFeature('show_metro_card');
    const showStatusCard = await this.settingsService.getDisplayFeature('show_status_card');
    const showDrivingCard = await this.settingsService.getDisplayFeature('show_driving_card');
    const showBikeshareCard = await this.settingsService.getDisplayFeature('show_bikeshare_card');
    const showNewsHeadlines = await this.settingsService.getDisplayFeature('show_news_headlines');
    return {
      showTicker: showTicker === 'true',
      showRotatingCards: showRotatingCards === 'true',
      showMetroCard: showMetroCard === 'true',
      showStatusCard: showStatusCard === 'true',
      showDrivingCard: showDrivingCard === 'true',
      showBikeshareCard: showBikeshareCard === 'true',
      showNewsHeadlines: showNewsHeadlines === 'true'
    };
  }

  @Patch('display/features')
  @Roles(UserRole.ADMIN)
  async updateDisplayFeatures(@Body() dto: UpdateDisplayFeaturesDto) {
    if (dto.showTicker !== undefined) {
      await this.settingsService.setDisplayFeature('show_ticker', String(dto.showTicker));
    }
    if (dto.showRotatingCards !== undefined) {
      await this.settingsService.setDisplayFeature('show_rotating_cards', String(dto.showRotatingCards));
    }
    if (dto.showMetroCard !== undefined) {
      await this.settingsService.setDisplayFeature('show_metro_card', String(dto.showMetroCard));
    }
    if (dto.showStatusCard !== undefined) {
      await this.settingsService.setDisplayFeature('show_status_card', String(dto.showStatusCard));
    }
    if (dto.showDrivingCard !== undefined) {
      await this.settingsService.setDisplayFeature('show_driving_card', String(dto.showDrivingCard));
    }
    if (dto.showBikeshareCard !== undefined) {
      await this.settingsService.setDisplayFeature('show_bikeshare_card', String(dto.showBikeshareCard));
    }
    if (dto.showNewsHeadlines !== undefined) {
      await this.settingsService.setDisplayFeature('show_news_headlines', String(dto.showNewsHeadlines));
    }
    return { message: 'Display features updated successfully', ...dto };
  }
}
