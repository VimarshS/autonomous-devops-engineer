import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ArtifactsController } from './artifacts.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ArtifactsController],
})
export class ArtifactsModule {}