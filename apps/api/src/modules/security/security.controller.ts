import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DatabaseService } from '../../database/database.service';
import { SecurityService } from './security.service';

@ApiTags('security')
@ApiBearerAuth()
@Controller('security')
export class SecurityController {
  constructor(
    private readonly securityService: SecurityService,
    private readonly db: DatabaseService,
  ) {}

  @Post('projects/:projectId/scan')
  @ApiOperation({ summary: 'Run security scan on project artifacts' })
  async scan(
    @Param('projectId') projectId: string,
    @CurrentUser() user: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const userId = user['id'] as string;

    const project = await this.db.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const artifacts = await this.db.artifact.findMany({
      where: { projectId },
      select: { type: true, filename: true, content: true },
    });

    const analysis = await this.db.analysis.findUnique({
      where: { projectId },
    });

    const envVars =
      (analysis?.detectedEnvVars as Array<{ key: string }> ?? []);

    const result = this.securityService.scan({
      artifacts: artifacts.map((a) => ({
        type: a.type,
        filename: a.filename,
        content: a.content,
      })),
      envVars,
    });

    await this.db.securityScan.upsert({
      where: { projectId },
      create: {
        projectId,
        status: 'COMPLETED',
        score: result.score,
        findings:
          result.findings as unknown as import('@prisma/client').Prisma.InputJsonValue,
        criticalCount: result.criticalCount,
        highCount: result.highCount,
        mediumCount: result.mediumCount,
        lowCount: result.lowCount,
        completedAt: new Date(),
      },
      update: {
        status: 'COMPLETED',
        score: result.score,
        findings:
          result.findings as unknown as import('@prisma/client').Prisma.InputJsonValue,
        criticalCount: result.criticalCount,
        highCount: result.highCount,
        mediumCount: result.mediumCount,
        lowCount: result.lowCount,
        completedAt: new Date(),
      },
    });

    return result;
  }

  @Get('projects/:projectId')
  @ApiOperation({ summary: 'Get security scan results' })
  async getScan(@Param('projectId') projectId: string) {
    return this.db.securityScan.findUnique({
      where: { projectId },
    });
  }
}