import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Playlist } from './entities/playlist.entity';
import { PlaylistItem } from './entities/playlist-item.entity';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';

@Injectable()
export class PlaylistsService {
  constructor(
    @InjectRepository(Playlist)
    private playlistRepository: Repository<Playlist>,
    @InjectRepository(PlaylistItem)
    private playlistItemRepository: Repository<PlaylistItem>,
  ) {}

  async create(
    createPlaylistDto: CreatePlaylistDto,
    userId?: string,
  ): Promise<Playlist> {
    const playlist = this.playlistRepository.create({
      name: createPlaylistDto.name,
      description: createPlaylistDto.description,
      loop: createPlaylistDto.loop ?? true,
      createdById: userId,
    });

    const savedPlaylist = await this.playlistRepository.save(playlist);

    // Create playlist items
    if (createPlaylistDto.items && createPlaylistDto.items.length > 0) {
      const items = createPlaylistDto.items.map((item, index) =>
        this.playlistItemRepository.create({
          playlistId: savedPlaylist.id,
          contentId: item.contentId,
          order: index,
          durationOverride: item.durationOverride,
        }),
      );

      await this.playlistItemRepository.save(items);
    }

    return this.findOne(savedPlaylist.id);
  }

  async findAll(): Promise<Playlist[]> {
    return this.playlistRepository.find({
      relations: ['items', 'items.content', 'createdBy'],
      order: {
        updatedAt: 'DESC',
        items: {
          order: 'ASC',
        },
      },
    });
  }

  async findOne(id: string): Promise<Playlist> {
    const playlist = await this.playlistRepository.findOne({
      where: { id },
      relations: ['items', 'items.content', 'createdBy'],
      order: {
        items: {
          order: 'ASC',
        },
      },
    });

    if (!playlist) {
      throw new NotFoundException(`Playlist with ID ${id} not found`);
    }

    return playlist;
  }

  async update(
    id: string,
    updatePlaylistDto: UpdatePlaylistDto,
  ): Promise<Playlist> {
    const playlist = await this.findOne(id);

    // Update basic fields
    if (updatePlaylistDto.name !== undefined) {
      playlist.name = updatePlaylistDto.name;
    }
    if (updatePlaylistDto.description !== undefined) {
      playlist.description = updatePlaylistDto.description;
    }
    if (updatePlaylistDto.loop !== undefined) {
      playlist.loop = updatePlaylistDto.loop;
    }

    await this.playlistRepository.save(playlist);

    // Update playlist items if provided
    if (updatePlaylistDto.items) {
      // Remove existing items
      await this.playlistItemRepository.delete({ playlistId: id });

      // Create new items
      if (updatePlaylistDto.items.length > 0) {
        const items = updatePlaylistDto.items.map((item, index) =>
          this.playlistItemRepository.create({
            playlistId: id,
            contentId: item.contentId,
            order: index,
            durationOverride: item.durationOverride,
          }),
        );

        await this.playlistItemRepository.save(items);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const playlist = await this.findOne(id);
    await this.playlistRepository.remove(playlist);
  }
}
