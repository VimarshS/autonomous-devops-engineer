import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DatabaseService } from '../../database/database.service';
import { CiCdService } from './cicd.service';

@ApiTags('cicd')
@ApiBearerAuth()
@Controller('cicd')
export class CiCdController {
  constructor(
    private readonly cicdService: CiCdService,
    private readonly db: DatabaseService,
  ) {}

  @Post('projects/:projectId/generate')
  @ApiOperation({ summary: 'Generate CI/CD pipelines' })
  async generate(
    @Param('projectId') projectId: string,
    @CurrentUser() user: Record<string, unknown>,
  ) {
    const userId = user['id'] as string;

    const analysis = await this.db.analysis.findUnique({
      where: { projectId },
    });

    if (!analysis) {
      throw new BadRequestException('No analysis found');
    }

    const project = await this.db.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const result = this.cicdService.generate({
      appName: project.repositoryName ?? 'app',
      region: project.awsRegion ?? 'us-east-1',
      framework: analysis.framework,
      packageManager: analysis.packageManager,
      testCommand: analysis.testCommand,
      buildCommand: analysis.buildCommand,
      containerPort: analysis.ports[0] ?? 3000,
    });

    await this.db.artifact.upsert({
      where: {
        projectId_type_version: {
          projectId,
          type: 'GITHUB_ACTIONS_CI',
          version: 1,
        },
      },
      create: {
        projectId,
        type: 'GITHUB_ACTIONS_CI',
        filename: '.github/workflows/build-test.yml',
        content: result.buildTest,
        version: 1,
      },
      update: {
        content: result.buildTest,
      },
    });

    await this.db.artifact.upsert({
      where: {
        projectId_type_version: {
          projectId,
          type: 'GITHUB_ACTIONS_CD',
          version: 1,
        },
      },
      create: {
        projectId,
        type: 'GITHUB_ACTIONS_CD',
        filename: '.github/workflows/deploy-ecs.yml',
        content: result.deployEcs,
        version: 1,
      },
      update: {
        content: result.deployEcs,
      },
    });

    return result;
  }

  @Get('projects/:projectId/artifacts')
  @ApiOperation({ summary: 'Get CI/CD artifacts' })
  async getArtifacts(@Param('projectId') projectId: string) {
    return this.db.artifact.findMany({
      where: {
        projectId,
        type: {
          in: ['GITHUB_ACTIONS_CI', 'GITHUB_ACTIONS_CD'],
        },
      },
    });
  }
}