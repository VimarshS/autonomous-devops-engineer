import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CiCdController } from './cicd.controller';
import { CiCdService } from './cicd.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CiCdController],
  providers: [CiCdService],
  exports: [CiCdService],
})
export class CiCdModule {}