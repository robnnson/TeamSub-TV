import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
