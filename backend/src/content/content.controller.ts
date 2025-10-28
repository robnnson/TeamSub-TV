import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  Res,
  Query,
  Req,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { FlexibleAuthGuard } from '../common/guards/flexible-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { ContentType } from './entities/content.entity';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import { pipeline } from 'stream/promises';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll(@Query('type') type?: ContentType) {
    if (type) {
      return this.contentService.findByType(type);
    }
    return this.contentService.findAll();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getStats() {
    return this.contentService.getStats();
  }

  @Get(':id')
  @UseGuards(FlexibleAuthGuard)
  findOne(@Param('id') id: string) {
    return this.contentService.findById(id);
  }

  @Get(':id/file')
  @UseGuards(FlexibleAuthGuard)
  async serveFile(@Param('id') id: string, @Res() res: FastifyReply) {
    const filePath = await this.contentService.getFilePath(id);
    const content = await this.contentService.findById(id);

    // Set appropriate content type
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
    };

    res.header('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.header('Content-Disposition', `inline; filename="${content.title}${ext}"`);

    const fileStream = fsSync.createReadStream(filePath);
    return res.send(fileStream);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async uploadFile(@Req() req: FastifyRequest, @CurrentUser() user: User) {
    try {
      const data = await req.file();

      if (!data) {
        throw new BadRequestException('No file uploaded');
      }

      // Validate MIME type
      const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'video/mp4',
        'video/webm',
        'video/quicktime',
      ];

      if (!allowedMimes.includes(data.mimetype)) {
        throw new BadRequestException('Invalid file type');
      }

      // Determine content type from file
      const isVideo = data.mimetype.startsWith('video/');
      const type = isVideo ? ContentType.VIDEO : ContentType.IMAGE;

      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(data.filename);
      const filename = `${uniqueSuffix}${ext}`;

      // Save file to media directory
      const uploadPath = path.join(process.cwd(), '..', 'media', 'images');

      // Ensure directory exists
      await fs.mkdir(uploadPath, { recursive: true });

      const filePath = path.join(uploadPath, filename);
      await pipeline(data.file, fsSync.createWriteStream(filePath));

      // Get additional fields
      const fields = data.fields as any;
      const title = fields.title?.value || data.filename;
      const duration = fields.duration?.value ? parseInt(fields.duration.value) : 10;

      // Store relative path from media directory
      const relativePath = path.join('images', filename);

      return this.contentService.create(
        title,
        type,
        relativePath,
        null,
        {},
        duration,
        user.id,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('File upload failed: ' + error.message);
    }
  }

  @Post('text')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createText(
    @Body() createContentDto: CreateContentDto,
    @CurrentUser() user: User,
  ) {
    if (!createContentDto.textContent) {
      throw new BadRequestException('Text content is required');
    }

    return this.contentService.create(
      createContentDto.title,
      ContentType.TEXT,
      null,
      createContentDto.textContent,
      createContentDto.metadata || {},
      createContentDto.duration || 10,
      user.id,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateContentDto: UpdateContentDto) {
    return this.contentService.update(
      id,
      updateContentDto.title,
      updateContentDto.textContent,
      updateContentDto.metadata,
      updateContentDto.duration,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.contentService.remove(id);
    return { message: 'Content deleted successfully' };
  }
}
