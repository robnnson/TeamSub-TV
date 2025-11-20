import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ReleaseNotesService } from './release-notes.service';
import { CreateReleaseNoteDto } from './dto/create-release-note.dto';
import { UpdateReleaseNoteDto } from './dto/update-release-note.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('release-notes')
export class ReleaseNotesController {
  constructor(private readonly releaseNotesService: ReleaseNotesService) {}

  @Get()
  findAll() {
    return this.releaseNotesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.releaseNotesService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createDto: CreateReleaseNoteDto) {
    return this.releaseNotesService.create(createDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateDto: UpdateReleaseNoteDto) {
    return this.releaseNotesService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.releaseNotesService.remove(id);
    return { message: 'Release note deleted successfully' };
  }
}
