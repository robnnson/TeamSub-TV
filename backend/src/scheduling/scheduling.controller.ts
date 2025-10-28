import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { FlexibleAuthGuard } from '../common/guards/flexible-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('schedules')
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get()
  @UseGuards(FlexibleAuthGuard)
  findAll(@Query('displayId') displayId?: string) {
    return this.schedulingService.findAll(displayId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getStats() {
    return this.schedulingService.getStats();
  }

  @Get('display/:displayId/active')
  @UseGuards(FlexibleAuthGuard)
  findActiveForDisplay(@Param('displayId') displayId: string) {
    return this.schedulingService.findActiveForDisplay(displayId);
  }

  @Get('display/:displayId/current')
  @UseGuards(FlexibleAuthGuard)
  getCurrentContent(@Param('displayId') displayId: string) {
    return this.schedulingService.getCurrentContent(displayId);
  }

  @Get(':id')
  @UseGuards(FlexibleAuthGuard)
  findOne(@Param('id') id: string) {
    return this.schedulingService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.schedulingService.create(createScheduleDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    return this.schedulingService.update(id, updateScheduleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.schedulingService.remove(id);
    return { message: 'Schedule deleted successfully' };
  }
}
