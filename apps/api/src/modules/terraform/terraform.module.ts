import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { TerraformController } from './terraform.controller';
import { TerraformService } from './terraform.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TerraformController],
  providers: [TerraformService],
  exports: [TerraformService],
})
export class TerraformModule {}