import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Display } from '../../displays/entities/display.entity';
import { Content } from '../../content/entities/content.entity';
import { Playlist } from '../../playlists/entities/playlist.entity';

@Entity('schedules')
@Index(['displayId', 'startTime', 'endTime'])
@Index(['isActive', 'startTime'])
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Display, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'display_id' })
  display: Display;

  @Column({ name: 'display_id' })
  displayId: string;

  @ManyToOne(() => Content, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'content_id' })
  content: Content;

  @Column({ name: 'content_id', nullable: true })
  contentId: string;

  // Simple playlist support - array of content IDs (no duration override)
  @Column({ type: 'json', nullable: true })
  contentIds: string[];

  // Advanced playlist support - reference to Playlist entity (with duration overrides)
  @ManyToOne(() => Playlist, { onDelete: 'CASCADE', nullable: true, eager: true })
  @JoinColumn({ name: 'playlist_id' })
  playlist: Playlist;

  @Column({ name: 'playlist_id', nullable: true })
  playlistId: string;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ nullable: true })
  recurrenceRule: string; // Cron expression

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
