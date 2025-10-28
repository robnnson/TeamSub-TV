import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DisplayGroup } from './entities/display-group.entity';
import { Display } from '../displays/entities/display.entity';
import { CreateDisplayGroupDto } from './dto/create-display-group.dto';
import { UpdateDisplayGroupDto } from './dto/update-display-group.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class DisplayGroupsService {
  constructor(
    @InjectRepository(DisplayGroup)
    private displayGroupRepository: Repository<DisplayGroup>,
    @InjectRepository(Display)
    private displayRepository: Repository<Display>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createDisplayGroupDto: CreateDisplayGroupDto): Promise<DisplayGroup> {
    const { displayIds, ...groupData } = createDisplayGroupDto;

    const group = this.displayGroupRepository.create(groupData);

    if (displayIds && displayIds.length > 0) {
      const displays = await this.displayRepository.findBy({
        id: In(displayIds),
      });
      group.displays = displays;
    }

    const saved = await this.displayGroupRepository.save(group);

    this.eventEmitter.emit('display-group.created', saved);

    return this.findOne(saved.id);
  }

  async findAll(): Promise<DisplayGroup[]> {
    return this.displayGroupRepository.find({
      relations: ['displays'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<DisplayGroup> {
    const group = await this.displayGroupRepository.findOne({
      where: { id },
      relations: ['displays'],
    });

    if (!group) {
      throw new NotFoundException(`Display group with ID ${id} not found`);
    }

    return group;
  }

  async update(
    id: string,
    updateDisplayGroupDto: UpdateDisplayGroupDto,
  ): Promise<DisplayGroup> {
    const group = await this.findOne(id);
    const { displayIds, ...updateData } = updateDisplayGroupDto;

    // Update basic fields
    Object.assign(group, updateData);

    // Update displays if provided
    if (displayIds !== undefined) {
      if (displayIds.length > 0) {
        const displays = await this.displayRepository.findBy({
          id: In(displayIds),
        });
        group.displays = displays;
      } else {
        group.displays = [];
      }
    }

    const saved = await this.displayGroupRepository.save(group);

    this.eventEmitter.emit('display-group.updated', saved);

    return this.findOne(saved.id);
  }

  async remove(id: string): Promise<void> {
    const group = await this.findOne(id);
    await this.displayGroupRepository.remove(group);

    this.eventEmitter.emit('display-group.deleted', { id });
  }

  async addDisplay(groupId: string, displayId: string): Promise<DisplayGroup> {
    const group = await this.findOne(groupId);
    const display = await this.displayRepository.findOne({
      where: { id: displayId },
    });

    if (!display) {
      throw new NotFoundException(`Display with ID ${displayId} not found`);
    }

    if (!group.displays) {
      group.displays = [];
    }

    // Check if display is already in group
    if (!group.displays.find((d) => d.id === displayId)) {
      group.displays.push(display);
      await this.displayGroupRepository.save(group);
    }

    this.eventEmitter.emit('display-group.updated', group);

    return this.findOne(groupId);
  }

  async removeDisplay(groupId: string, displayId: string): Promise<DisplayGroup> {
    const group = await this.findOne(groupId);

    group.displays = group.displays.filter((d) => d.id !== displayId);
    await this.displayGroupRepository.save(group);

    this.eventEmitter.emit('display-group.updated', group);

    return this.findOne(groupId);
  }
}
