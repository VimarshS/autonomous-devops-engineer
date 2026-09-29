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
import { TerraformService } from './terraform.service';

@ApiTags('terraform')
@ApiBearerAuth()
@Controller('terraform')
export class TerraformController {
  constructor(
    private readonly terraformService: TerraformService,
    private readonly db: DatabaseService,
  ) {}

  @Post('projects/:projectId/generate')
  @ApiOperation({ summary: 'Generate Terraform configuration' })
  async generate(
    @Param('projectId') projectId: string,
    @CurrentUser() user: Record<string, unknown>,
  ): Promise<{
    mainTf: string;
    variablesTf: string;
    files: Record<string, string>;
  }> {
    const userId = user['id'] as string;

    const analysis = await this.db.analysis.findUnique({
      where: { projectId },
    });

    if (!analysis) {
      throw new BadRequestException(
        'No analysis found. Run analysis first.',
      );
    }

    const project = await this.db.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const result = this.terraformService.generate({
      appName: project.repositoryName ?? 'app',
      region: project.awsRegion ?? 'us-east-1',
      containerPort: analysis.ports[0] ?? 3000,
      framework: analysis.framework,
    });

    // Store artifacts
    await this.db.artifact.upsert({
      where: {
        projectId_type_version: {
          projectId,
          type: 'TERRAFORM_MAIN',
          version: 1,
        },
      },
      create: {
        projectId,
        type: 'TERRAFORM_MAIN',
        filename: 'main.tf',
        content: result.mainTf,
        version: 1,
      },
      update: {
        content: result.mainTf,
      },
    });

    await this.db.artifact.upsert({
      where: {
        projectId_type_version: {
          projectId,
          type: 'TERRAFORM_VARIABLES',
          version: 1,
        },
      },
      create: {
        projectId,
        type: 'TERRAFORM_VARIABLES',
        filename: 'variables.tf',
        content: result.variablesTf,
        version: 1,
      },
      update: {
        content: result.variablesTf,
      },
    });

    return result;
  }

  @Get('projects/:projectId/artifacts')
  @ApiOperation({ summary: 'Get Terraform artifacts' })
  async getArtifacts(@Param('projectId') projectId: string) {
    return this.db.artifact.findMany({
      where: {
        projectId,
        type: {
          in: [
            'TERRAFORM_MAIN',
            'TERRAFORM_VARIABLES',
            'TERRAFORM_OUTPUTS',
          ],
        },
      },
    });
  }
}