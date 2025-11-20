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
import { ThumbnailService } from './thumbnail.service';
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
  constructor(
    private readonly contentService: ContentService,
    private readonly thumbnailService: ThumbnailService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll(
    @Query('type') type?: ContentType,
    @Query('search') search?: string,
    @Query('tags') tags?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    const includeArchivedBool = includeArchived === 'true';

    // If any filter is provided, use the search method
    if (type || search || tags) {
      return this.contentService.search({
        type,
        search,
        tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
        includeArchived: includeArchivedBool,
      });
    }

    return this.contentService.findAll(includeArchivedBool);
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

  @Get(':id/thumbnail')
  async serveThumbnail(@Param('id') id: string, @Res() res: FastifyReply) {
    const content = await this.contentService.findById(id);

    if (!content.thumbnailPath) {
      throw new BadRequestException('No thumbnail available for this content');
    }

    const mediaDir = process.env.MEDIA_DIR || path.join(process.cwd(), 'media');
    const thumbnailFullPath = path.join(mediaDir, content.thumbnailPath);

    res.header('Content-Type', 'image/jpeg');
    res.header('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    const fileStream = fsSync.createReadStream(thumbnailFullPath);
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

      // Save file to media directory (mounted at /app/media in Docker)
      const mediaDir = process.env.MEDIA_DIR || path.join(process.cwd(), 'media');
      const uploadPath = path.join(mediaDir, 'images');

      // Ensure directory exists
      await fs.mkdir(uploadPath, { recursive: true });

      const filePath = path.join(uploadPath, filename);
      await pipeline(data.file, fsSync.createWriteStream(filePath));

      // Get additional fields
      const fields = data.fields as any;
      const title = fields.title?.value || data.filename;
      const duration = fields.duration?.value ? parseInt(fields.duration.value) : 10;
      const expiresAt = fields.expiresAt?.value || undefined;

      // Store relative path from media directory (for serving via /images endpoint)
      const relativePath = path.join('images', filename);

      // Generate thumbnail for images
      let thumbnailPath: string | null = null;
      if (type === ContentType.IMAGE) {
        const thumbnailDir = await this.thumbnailService.ensureThumbnailDirectory();
        const thumbnailFilename = `thumb_${uniqueSuffix}.jpg`;
        const thumbnailFullPath = path.join(thumbnailDir, thumbnailFilename);

        try {
          await this.thumbnailService.generateImageThumbnail(filePath, thumbnailFullPath);
          thumbnailPath = path.join('thumbnails', thumbnailFilename);
        } catch (error) {
          // Log error but don't fail the upload
          console.error('Failed to generate thumbnail:', error);
        }
      }

      return this.contentService.create(
        title,
        type,
        relativePath,
        null,
        {},
        duration,
        user.id,
        expiresAt,
        thumbnailPath,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('File upload failed: ' + error.message);
    }
  }

  @Post('upload/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async uploadBulkFiles(@Req() req: FastifyRequest, @CurrentUser() user: User) {
    try {
      const files = await req.files();

      const MAX_FILES = 20;
      const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB

      const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'video/mp4',
        'video/webm',
        'video/quicktime',
      ];

      const results = {
        successful: [],
        failed: [],
        totalProcessed: 0,
      };

      let totalSize = 0;
      let fileCount = 0;

      for await (const data of files) {
        fileCount++;

        // Check file count limit
        if (fileCount > MAX_FILES) {
          results.failed.push({
            filename: data.filename,
            error: `Maximum ${MAX_FILES} files allowed per upload`,
          });
          continue;
        }

        try {
          // Validate MIME type
          if (!allowedMimes.includes(data.mimetype)) {
            results.failed.push({
              filename: data.filename,
              error: 'Invalid file type',
            });
            continue;
          }

          // Read file to buffer to check size
          const chunks = [];
          for await (const chunk of data.file) {
            chunks.push(chunk);
          }
          const buffer = Buffer.concat(chunks);

          totalSize += buffer.length;

          // Check total size limit
          if (totalSize > MAX_TOTAL_SIZE) {
            results.failed.push({
              filename: data.filename,
              error: 'Total upload size exceeds 500MB limit',
            });
            continue;
          }

          // Determine content type from file
          const isVideo = data.mimetype.startsWith('video/');
          const type = isVideo ? ContentType.VIDEO : ContentType.IMAGE;

          // Generate unique filename
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(data.filename);
          const filename = `${uniqueSuffix}${ext}`;

          // Save file to media directory
          const mediaDir = process.env.MEDIA_DIR || path.join(process.cwd(), 'media');
          const uploadPath = path.join(mediaDir, 'images');

          // Ensure directory exists
          await fs.mkdir(uploadPath, { recursive: true });

          const filePath = path.join(uploadPath, filename);
          await fs.writeFile(filePath, buffer);

          // Get additional fields
          const fields = data.fields as any;
          const title = fields.title?.value || data.filename;
          const duration = fields.duration?.value ? parseInt(fields.duration.value) : 10;
          const expiresAt = fields.expiresAt?.value || undefined;

          // Store relative path from media directory
          const relativePath = path.join('images', filename);

          // Generate thumbnail for images
          let thumbnailPath: string | null = null;
          if (type === ContentType.IMAGE) {
            const thumbnailDir = await this.thumbnailService.ensureThumbnailDirectory();
            const thumbnailFilename = `thumb_${uniqueSuffix}.jpg`;
            const thumbnailFullPath = path.join(thumbnailDir, thumbnailFilename);

            try {
              await this.thumbnailService.generateImageThumbnail(filePath, thumbnailFullPath);
              thumbnailPath = path.join('thumbnails', thumbnailFilename);
            } catch (error) {
              // Log error but don't fail the upload
              console.error('Failed to generate thumbnail:', error);
            }
          }

          const content = await this.contentService.create(
            title,
            type,
            relativePath,
            null,
            {},
            duration,
            user.id,
            expiresAt,
            thumbnailPath,
          );

          results.successful.push({
            filename: data.filename,
            content,
          });
        } catch (error) {
          results.failed.push({
            filename: data.filename,
            error: error.message,
          });
        }

        results.totalProcessed++;
      }

      return {
        ...results,
        message: `Processed ${results.totalProcessed} files. ${results.successful.length} succeeded, ${results.failed.length} failed.`,
      };
    } catch (error) {
      throw new BadRequestException('Bulk upload failed: ' + error.message);
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

    // Generate thumbnail for text content
    let thumbnailPath: string | null = null;
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const thumbnailDir = await this.thumbnailService.ensureThumbnailDirectory();
      const thumbnailFilename = `thumb_text_${uniqueSuffix}.jpg`;
      const thumbnailFullPath = path.join(thumbnailDir, thumbnailFilename);

      const backgroundColor = createContentDto.metadata?.backgroundColor || '#FFFFFF';
      await this.thumbnailService.generateTextThumbnail(
        createContentDto.textContent,
        backgroundColor,
        thumbnailFullPath,
      );
      thumbnailPath = path.join('thumbnails', thumbnailFilename);
    } catch (error) {
      // Log error but don't fail the creation
      console.error('Failed to generate text thumbnail:', error);
    }

    return this.contentService.create(
      createContentDto.title,
      ContentType.TEXT,
      null,
      createContentDto.textContent,
      createContentDto.metadata || {},
      createContentDto.duration || 10,
      user.id,
      createContentDto.expiresAt,
      thumbnailPath,
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
      updateContentDto.expiresAt,
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
