import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List all projects for current user' })
  findAll(@CurrentUser() user: Record<string, unknown>) {
    return this.projectsService.findAll(user['id'] as string);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single project' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: Record<string, unknown>,
  ) {
    return this.projectsService.findOne(id, user['id'] as string);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: Record<string, unknown>,
  ) {
    return this.projectsService.create(user['id'] as string, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: Record<string, unknown>,
  ) {
    return this.projectsService.update(id, user['id'] as string, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: Record<string, unknown>,
  ) {
    return this.projectsService.remove(id, user['id'] as string);
  }
}