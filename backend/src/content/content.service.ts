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
    expiresAt?: string,
    thumbnailPath?: string | null,
  ): Promise<Content> {
    const content = this.contentRepository.create({
      title,
      type,
      filePath,
      textContent,
      metadata,
      duration,
      createdById,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      thumbnailPath: thumbnailPath || null,
    });

    const saved = await this.contentRepository.save(content);

    // Emit event for real-time updates
    this.eventEmitter.emit('content.created', saved);

    return saved;
  }

  async findAll(includeArchived = false): Promise<Content[]> {
    const query = this.contentRepository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.createdBy', 'user')
      .orderBy('content.createdAt', 'DESC');

    if (!includeArchived) {
      query.andWhere('content.isArchived = :isArchived', { isArchived: false });
    }

    return query.getMany();
  }

  async archiveExpiredContent(): Promise<number> {
    const result = await this.contentRepository
      .createQueryBuilder()
      .update(Content)
      .set({ isArchived: true })
      .where('expiresAt IS NOT NULL')
      .andWhere('expiresAt < :now', { now: new Date() })
      .andWhere('isArchived = :isArchived', { isArchived: false })
      .execute();

    if (result.affected && result.affected > 0) {
      this.eventEmitter.emit('content.archived', { count: result.affected });
    }

    return result.affected || 0;
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

  async search(filters: {
    type?: ContentType;
    search?: string;
    tags?: string[];
    includeArchived?: boolean;
  }): Promise<Content[]> {
    const query = this.contentRepository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.createdBy', 'user');

    // Filter by archived status
    if (!filters.includeArchived) {
      query.andWhere('content.isArchived = :isArchived', { isArchived: false });
    }

    // Filter by type
    if (filters.type) {
      query.andWhere('content.type = :type', { type: filters.type });
    }

    // Search by title or text content
    if (filters.search) {
      query.andWhere(
        '(LOWER(content.title) LIKE LOWER(:search) OR LOWER(content.textContent) LIKE LOWER(:search))',
        { search: `%${filters.search}%` },
      );
    }

    // Filter by tags (stored in metadata.tags array)
    if (filters.tags && filters.tags.length > 0) {
      // Use JSON contains for PostgreSQL
      query.andWhere(
        `content.tags && ARRAY[:...tags]::text[]`,
        { tags: filters.tags },
      );
    }

    query.orderBy('content.createdAt', 'DESC');

    return query.getMany();
  }

  async update(
    id: string,
    title?: string,
    textContent?: string,
    metadata?: Record<string, any>,
    duration?: number,
    expiresAt?: string,
  ): Promise<Content> {
    const content = await this.findById(id);

    if (title !== undefined) content.title = title;
    if (textContent !== undefined) content.textContent = textContent;
    if (metadata !== undefined) content.metadata = metadata;
    if (duration !== undefined) content.duration = duration;
    if (expiresAt !== undefined) {
      content.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

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
