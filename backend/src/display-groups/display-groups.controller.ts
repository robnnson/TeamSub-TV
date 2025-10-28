import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { DisplayGroupsService } from './display-groups.service';
import { CreateDisplayGroupDto } from './dto/create-display-group.dto';
import { UpdateDisplayGroupDto } from './dto/update-display-group.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('display-groups')
@UseGuards(JwtAuthGuard)
export class DisplayGroupsController {
  constructor(private readonly displayGroupsService: DisplayGroupsService) {}

  @Post()
  create(@Body() createDisplayGroupDto: CreateDisplayGroupDto) {
    return this.displayGroupsService.create(createDisplayGroupDto);
  }

  @Get()
  findAll() {
    return this.displayGroupsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.displayGroupsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDisplayGroupDto: UpdateDisplayGroupDto,
  ) {
    return this.displayGroupsService.update(id, updateDisplayGroupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.displayGroupsService.remove(id);
  }

  @Post(':id/displays/:displayId')
  addDisplay(@Param('id') id: string, @Param('displayId') displayId: string) {
    return this.displayGroupsService.addDisplay(id, displayId);
  }

  @Delete(':id/displays/:displayId')
  removeDisplay(
    @Param('id') id: string,
    @Param('displayId') displayId: string,
  ) {
    return this.displayGroupsService.removeDisplay(id, displayId);
  }
}
