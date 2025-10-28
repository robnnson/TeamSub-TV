import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisplayGroupsService } from './display-groups.service';
import { DisplayGroupsController } from './display-groups.controller';
import { DisplayGroup } from './entities/display-group.entity';
import { Display } from '../displays/entities/display.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DisplayGroup, Display])],
  controllers: [DisplayGroupsController],
  providers: [DisplayGroupsService],
  exports: [DisplayGroupsService],
})
export class DisplayGroupsModule {}
