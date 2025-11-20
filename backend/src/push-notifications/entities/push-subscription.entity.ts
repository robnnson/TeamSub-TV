import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('push_subscriptions')
export class PushSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Column({ type: 'text' })
  endpoint: string;

  @Column({ type: 'text' })
  p256dhKey: string;

  @Column({ type: 'text' })
  authKey: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences: {
    displayOffline?: boolean;
    displayOnline?: boolean;
    highErrors?: boolean;
    lowUptime?: boolean;
    performanceIssues?: boolean;
  };

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
