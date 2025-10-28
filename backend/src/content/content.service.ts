import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content, ContentType } from './entities/content.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(
    title: string,
    type: ContentType,
    filePath: string | null,
    textContent: string | null,
    metadata: Record<string, any>,
    duration: number,
    createdById: string,
  ): Promise<Content> {
    const content = this.contentRepository.create({
      title,
      type,
      filePath,
      textContent,
      metadata,
      duration,
      createdById,
    });

    const saved = await this.contentRepository.save(content);

    // Emit event for real-time updates
    this.eventEmitter.emit('content.created', saved);

    return saved;
  }

  async findAll(): Promise<Content[]> {
    return this.contentRepository.find({
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Content> {
    const content = await this.contentRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    return content;
  }

  async findByType(type: ContentType): Promise<Content[]> {
    return this.contentRepository.find({
      where: { type },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    title?: string,
    textContent?: string,
    metadata?: Record<string, any>,
    duration?: number,
  ): Promise<Content> {
    const content = await this.findById(id);

    if (title !== undefined) content.title = title;
    if (textContent !== undefined) content.textContent = textContent;
    if (metadata !== undefined) content.metadata = metadata;
    if (duration !== undefined) content.duration = duration;

    const updated = await this.contentRepository.save(content);

    // Emit event for real-time updates
    this.eventEmitter.emit('content.updated', updated);

    return updated;
  }

  async remove(id: string): Promise<void> {
    const content = await this.findById(id);

    // Delete associated file if it exists
    if (content.filePath) {
      try {
        const mediaDir = process.env.MEDIA_DIR || path.join(process.cwd(), 'media');
        const fullPath = path.join(mediaDir, content.filePath);
        await fs.unlink(fullPath);
      } catch (error) {
        console.error(`Failed to delete file: ${content.filePath}`, error);
      }
    }

    await this.contentRepository.remove(content);

    // Emit event for real-time updates
    this.eventEmitter.emit('content.deleted', { id });
  }

  async getFilePath(id: string): Promise<string> {
    const content = await this.findById(id);

    if (!content.filePath) {
      throw new BadRequestException('Content does not have an associated file');
    }

    const mediaDir = process.env.MEDIA_DIR || path.join(process.cwd(), 'media');
    const fullPath = path.join(mediaDir, content.filePath);

    try {
      await fs.access(fullPath);
      return fullPath;
    } catch {
      throw new NotFoundException('File not found on disk');
    }
  }

  async getStats(): Promise<{
    total: number;
    byType: Record<ContentType, number>;
  }> {
    const all = await this.contentRepository.find();

    const stats = {
      total: all.length,
      byType: {
        [ContentType.IMAGE]: 0,
        [ContentType.VIDEO]: 0,
        [ContentType.SLIDESHOW]: 0,
        [ContentType.TEXT]: 0,
      },
    };

    all.forEach(content => {
      stats.byType[content.type]++;
    });

    return stats;
  }
}
