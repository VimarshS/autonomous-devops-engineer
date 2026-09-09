import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { DockerController } from './docker.controller';
import { DockerService } from './docker.service';

@Module({
  imports: [DatabaseModule],
  controllers: [DockerController],
  providers: [DockerService],
  exports: [DockerService],
})
export class DockerModule {}