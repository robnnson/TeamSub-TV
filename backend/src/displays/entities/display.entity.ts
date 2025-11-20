import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { DisplayGroup } from '../../display-groups/entities/display-group.entity';
import { LayoutType } from '../types/layout-type.enum';

export enum DisplayStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

@Entity('displays')
export class Display {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  location: string;

  @Column({
    type: 'enum',
    enum: LayoutType,
    default: LayoutType.STANDARD,
    nullable: true,
  })
  layoutType: LayoutType;

  @Column({ type: 'text' })
  apiKeyEncrypted: string;

  @Column()
  apiKeyIv: string;

  @Column({ nullable: true })
  pairingCode: string;

  @Column({ type: 'timestamp', nullable: true })
  pairingCodeExpiry: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSeen: Date;

  @Column({
    type: 'enum',
    enum: DisplayStatus,
    default: DisplayStatus.OFFLINE,
  })
  status: DisplayStatus;

  @Column({ nullable: true })
  lastScreenshotPath: string;

  @Column({ type: 'timestamp', nullable: true })
  lastScreenshotAt: Date;

  // Health monitoring fields
  @Column({ type: 'timestamp', nullable: true })
  lastHeartbeat: Date;

  @Column({ type: 'float', nullable: true })
  uptimePercentage: number;

  @Column({ type: 'int', default: 0 })
  totalHeartbeats: number;

  @Column({ type: 'int', default: 0 })
  missedHeartbeats: number;

  @Column({ type: 'timestamp', nullable: true })
  lastOnlineAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastOfflineAt: Date;

  @Column({ type: 'int', nullable: true })
  currentContentId: number;

  @Column({ type: 'jsonb', nullable: true })
  performanceMetrics: {
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
    networkLatency?: number;
    lastUpdated?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  errorLogs: Array<{
    timestamp: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;

  @ManyToMany(() => DisplayGroup, (group) => group.displays)
  groups: DisplayGroup[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
