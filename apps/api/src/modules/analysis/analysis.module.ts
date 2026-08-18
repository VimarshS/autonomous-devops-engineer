import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { ANALYSIS_QUEUE } from './analysis.service';

@Module({
  imports: [
    DatabaseModule,
    BullModule.registerQueue({ name: ANALYSIS_QUEUE }),
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}