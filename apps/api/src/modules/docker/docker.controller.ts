import { Controller, Post, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DatabaseService } from '../../database/database.service';
import { DockerService } from './docker.service';

@ApiTags('docker')
@ApiBearerAuth()
@Controller('docker')
export class DockerController {
  constructor(
    private readonly dockerService: DockerService,
    private readonly db: DatabaseService,
  ) {}

  @Post('projects/:projectId/generate')
  @ApiOperation({ summary: 'Generate Dockerfile for a project' })
  async generate(
    @Param('projectId') projectId: string,
    @CurrentUser() user: Record<string, unknown>,
  ) {
    const userId = user['id'] as string;

    // Get analysis results
    const analysis = await this.db.analysis.findUnique({
      where: { projectId },
    });

    if (!analysis) {
      throw new Error('No analysis found. Run analysis first.');
    }

    const project = await this.db.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Generate Dockerfile
    const result = this.dockerService.generate({
      framework: analysis.framework,
      packageManager: analysis.packageManager,
      ports: analysis.ports,
      startCommand: analysis.startCommand,
      buildCommand: analysis.buildCommand,
      appName: project.repositoryName ?? 'app',
    });

    // Store as artifacts
    await this.db.artifact.upsert({
      where: { projectId_type_version: { projectId, type: 'DOCKERFILE', version: 1 } },
      create: {
        projectId,
        type: 'DOCKERFILE',
        filename: 'Dockerfile',
        content: result.dockerfile,
        version: 1,
      },
      update: {
        content: result.dockerfile,
      },
    });

    await this.db.artifact.upsert({
      where: { projectId_type_version: { projectId, type: 'DOCKER_COMPOSE', version: 1 } },
      create: {
        projectId,
        type: 'DOCKER_COMPOSE',
        filename: 'docker-compose.yml',
        content: result.dockerCompose,
        version: 1,
      },
      update: {
        content: result.dockerCompose,
      },
    });

    // Update project status
    await this.db.project.update({
      where: { id: projectId },
      data: { status: 'GENERATED' },
    });

    return {
      dockerfile: result.dockerfile,
      dockerCompose: result.dockerCompose,
      framework: result.framework,
    };
  }

  @Get('projects/:projectId/artifacts')
  @ApiOperation({ summary: 'Get generated Docker artifacts' })
  async getArtifacts(@Param('projectId') projectId: string) {
    return this.db.artifact.findMany({
      where: { projectId, type: { in: ['DOCKERFILE', 'DOCKER_COMPOSE'] } },
      orderBy: { version: 'desc' },
    });
  }
}