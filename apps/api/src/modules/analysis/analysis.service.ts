import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';

import { DatabaseService } from '../../database/database.service';

export const ANALYSIS_QUEUE = 'analysis';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly db: DatabaseService,
    @InjectQueue(ANALYSIS_QUEUE) private readonly analysisQueue: Queue,
  ) {}

  async triggerAnalysis(projectId: string, userId: string) {
    // Verify project exists and belongs to user
    const project = await this.db.project.findFirst({
      where: { id: projectId, userId, deletedAt: null },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!project.repositoryUrl) {
      throw new Error('Project has no repository connected');
    }

    // Update project status to ANALYZING
    await this.db.project.update({
      where: { id: projectId },
      data: { status: 'ANALYZING' },
    });

    // Create job record in DB
    const job = await this.db.job.create({
      data: {
        projectId,
        queue: ANALYSIS_QUEUE,
        jobType: 'analyze-repository',
        status: 'PENDING',
        input: {
          projectId,
          repositoryOwner: project.repositoryOwner,
          repositoryName: project.repositoryName,
          defaultBranch: project.defaultBranch ?? 'main',
          userId,
        },
      },
    });

    // Queue the job
    await this.analysisQueue.add(
      'analyze-repository',
      {
        jobId: job.id,
        projectId,
        repositoryOwner: project.repositoryOwner,
        repositoryName: project.repositoryName,
        defaultBranch: project.defaultBranch ?? 'main',
        userId,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    // Create audit event
    await this.db.projectEvent.create({
      data: {
        projectId,
        eventType: 'ANALYSIS_STARTED',
        actorId: userId,
      },
    });

    return { jobId: job.id, status: 'QUEUED' };
  }

  async getAnalysis(projectId: string, userId: string) {
    const project = await this.db.project.findFirst({
      where: { id: projectId, userId, deletedAt: null },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.db.analysis.findUnique({
      where: { projectId },
    });
  }
}