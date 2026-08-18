import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnalysisService } from './analysis.service';

@ApiTags('analysis')
@ApiBearerAuth()
@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('projects/:projectId/trigger')
  @ApiOperation({ summary: 'Trigger repository analysis' })
  trigger(
    @Param('projectId') projectId: string,
    @CurrentUser() user: Record<string, unknown>,
  ) {
    return this.analysisService.triggerAnalysis(
      projectId,
      user['id'] as string,
    );
  }

  @Get('projects/:projectId')
  @ApiOperation({ summary: 'Get analysis results for a project' })
  getAnalysis(
    @Param('projectId') projectId: string,
    @CurrentUser() user: Record<string, unknown>,
  ) {
    return this.analysisService.getAnalysis(
      projectId,
      user['id'] as string,
    );
  }
}