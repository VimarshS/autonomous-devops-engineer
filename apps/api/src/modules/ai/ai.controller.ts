import { Body, Controller, Post, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DatabaseService } from '../../database/database.service';
import { AiService } from './ai.service';

class AskAiDto {
  @IsString()
  question: string;
}

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly db: DatabaseService,
  ) {}

  @Post('projects/:projectId/ask')
  @ApiOperation({ summary: 'Ask AI about a project' })
  async ask(
    @Param('projectId') projectId: string,
    @Body() dto: AskAiDto,
    @CurrentUser() user: Record<string, unknown>,
  ) {
    const userId = user['id'] as string;

    const project = await this.db.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) throw new Error('Project not found');

    const analysis = await this.db.analysis.findUnique({
      where: { projectId },
    });

    const artifacts = await this.db.artifact.findMany({
      where: { projectId },
      select: { filename: true, content: true },
      take: 3,
    });

    const securityScan = await this.db.securityScan.findUnique({
      where: { projectId },
    });

    const response = await this.aiService.troubleshoot({
      projectName: project.name,
      framework: analysis?.framework ?? 'UNKNOWN',
      language: analysis?.primaryLanguage ?? 'UNKNOWN',
      packageManager: analysis?.packageManager ?? 'UNKNOWN',
      hasDockerfile: analysis?.hasDockerfile ?? false,
      securityFindings: securityScan?.findings as Array<{
        title: string;
        severity: string;
        description: string;
        recommendation: string;
      }> ?? [],
      artifacts: artifacts.map(a => ({
        filename: a.filename,
        content: a.content,
      })),
      question: dto.question,
    });

    return { response, projectId };
  }
}