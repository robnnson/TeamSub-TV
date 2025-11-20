import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReleaseNote } from './entities/release-note.entity';
import { CreateReleaseNoteDto } from './dto/create-release-note.dto';
import { UpdateReleaseNoteDto } from './dto/update-release-note.dto';

@Injectable()
export class ReleaseNotesService {
  constructor(
    @InjectRepository(ReleaseNote)
    private releaseNoteRepository: Repository<ReleaseNote>,
  ) {}

  async create(createDto: CreateReleaseNoteDto): Promise<ReleaseNote> {
    const releaseNote = this.releaseNoteRepository.create({
      ...createDto,
      releaseDate: new Date(createDto.releaseDate),
    });
    return this.releaseNoteRepository.save(releaseNote);
  }

  async findAll(): Promise<ReleaseNote[]> {
    return this.releaseNoteRepository.find({
      order: { releaseDate: 'DESC' },
    });
  }

  async findById(id: string): Promise<ReleaseNote> {
    const releaseNote = await this.releaseNoteRepository.findOne({
      where: { id },
    });

    if (!releaseNote) {
      throw new NotFoundException(`Release note with ID ${id} not found`);
    }

    return releaseNote;
  }

  async update(id: string, updateDto: UpdateReleaseNoteDto): Promise<ReleaseNote> {
    const releaseNote = await this.findById(id);

    if (updateDto.version) releaseNote.version = updateDto.version;
    if (updateDto.title) releaseNote.title = updateDto.title;
    if (updateDto.content) releaseNote.content = updateDto.content;
    if (updateDto.releaseDate) releaseNote.releaseDate = new Date(updateDto.releaseDate);
    if (updateDto.isMajor !== undefined) releaseNote.isMajor = updateDto.isMajor;

    return this.releaseNoteRepository.save(releaseNote);
  }

  async remove(id: string): Promise<void> {
    const releaseNote = await this.findById(id);
    await this.releaseNoteRepository.remove(releaseNote);
  }
}
