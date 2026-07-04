import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { GitHubController } from './github.controller';
import { GitHubService } from './github.service';

@Module({
  imports: [DatabaseModule],
  controllers: [GitHubController],
  providers: [GitHubService],
  exports: [GitHubService],
})
export class GitHubModule {}