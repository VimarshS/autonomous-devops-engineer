import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '../../database/database.service';

@ApiTags('artifacts')
@ApiBearerAuth()
@Controller('artifacts')
export class ArtifactsController {
  constructor(private readonly db: DatabaseService) {}

  @Get('projects/:projectId')
  @ApiOperation({ summary: 'Get all artifacts for a project' })
  async getArtifacts(@Param('projectId') projectId: string) {
    return this.db.artifact.findMany({
      where: { projectId },
      orderBy: [{ type: 'asc' }, { version: 'desc' }],
      select: { id: true, type: true, filename: true, version: true, createdAt: true, content: true },
    });
  }
}