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

  @ManyToOne(() => Content, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  content: Content;

  @Column({ name: 'content_id' })
  contentId: string;

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
