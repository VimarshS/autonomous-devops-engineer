import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(userId: string) {
    return this.db.project.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        repositoryUrl: true,
        repositoryOwner: true,
        repositoryName: true,
        deployedUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string, userId: string) {
    const project = await this.db.project.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async create(userId: string, dto: CreateProjectDto) {
    // Parse repository owner and name from URL if provided
    let repositoryOwner: string | undefined;
    let repositoryName: string | undefined;

    if (dto.repositoryUrl) {
      const match = dto.repositoryUrl.match(
        /github\.com\/([^/]+)\/([^/]+)/,
      );
      if (match) {
        repositoryOwner = match[1];
        repositoryName = match[2]?.replace('.git', '');
      }
    }

    const project = await this.db.project.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        repositoryUrl: dto.repositoryUrl,
        repositoryOwner,
        repositoryName,
      },
    });

    // Create audit event
    await this.db.projectEvent.create({
      data: {
        projectId: project.id,
        eventType: 'PROJECT_CREATED',
        actorId: userId,
        metadata: { name: dto.name },
      },
    });

    return project;
  }

  async update(id: string, userId: string, dto: UpdateProjectDto) {
    await this.findOne(id, userId);

    return this.db.project.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    // Soft delete
    await this.db.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Create audit event
    await this.db.projectEvent.create({
      data: {
        projectId: id,
        eventType: 'PROJECT_DELETED',
        actorId: userId,
      },
    });

    return { success: true };
  }
}