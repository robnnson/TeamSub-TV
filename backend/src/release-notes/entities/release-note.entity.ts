import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('release_notes')
export class ReleaseNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  version: string;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({ type: 'timestamp' })
  releaseDate: Date;

  @Column({ default: false })
  isMajor: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
