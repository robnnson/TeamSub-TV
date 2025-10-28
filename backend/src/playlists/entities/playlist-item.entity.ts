import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Playlist } from './playlist.entity';
import { Content } from '../../content/entities/content.entity';

@Entity('playlist_items')
@Index(['playlistId', 'order'])
export class PlaylistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Playlist, (playlist) => playlist.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'playlist_id' })
  playlist: Playlist;

  @Column({ name: 'playlist_id' })
  playlistId: string;

  @ManyToOne(() => Content, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'content_id' })
  content: Content;

  @Column({ name: 'content_id' })
  contentId: string;

  @Column({ type: 'int' })
  order: number;

  // Duration override in seconds (null = use content's default duration)
  @Column({ type: 'int', nullable: true })
  durationOverride: number;
}
