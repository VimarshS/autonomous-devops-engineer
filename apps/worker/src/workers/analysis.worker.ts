import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import {
  emitProgress,
  emitCompleted,
  emitFailed,
} from '../redis-emitter.js';

export const ANALYSIS_QUEUE = 'analysis';

interface AnalysisJobData {
  jobId: string;
  projectId: string;
  repositoryOwner: string;
  repositoryName: string;
  defaultBranch: string;
  userId: string;
}

@Processor(ANALYSIS_QUEUE)
export class AnalysisWorker extends WorkerHost {
  private readonly logger = new Logger(AnalysisWorker.name);
  private readonly db = new PrismaClient();

  async process(job: Job<AnalysisJobData>): Promise<void> {
    const {
      jobId,
      projectId,
      repositoryOwner,
      repositoryName,
      defaultBranch,
      userId,
    } = job.data;

    this.logger.log(
      `Processing analysis for ${repositoryOwner}/${repositoryName}`,
    );

    try {
      // Update job status to RUNNING
      await this.db.job.update({
        where: { id: jobId },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
        },
      });

      await job.updateProgress(10);

      // Redis progress event
      await emitProgress(
        projectId,
        jobId,
        10,
        'Fetching GitHub token...',
      );

      // Step 1: Fetch GitHub token
      const account = await this.db.account.findFirst({
        where: {
          userId,
          providerId: 'github',
        },
        select: {
          accessToken: true,
        },
      });

      if (!account?.accessToken) {
        throw new Error('No GitHub token found for user');
      }

      // Step 2: Fetch file tree
      this.logger.log(`[${projectId}] Fetching file tree...`);

      const treeResponse = await fetch(
        `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/git/trees/${defaultBranch}?recursive=1`,
        {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
            Accept: 'application/vnd.github+json',
          },
        },
      );

      if (!treeResponse.ok) {
        throw new Error(`GitHub API error: ${treeResponse.status}`);
      }

      const treeData = (await treeResponse.json()) as {
        tree: Array<{
          path: string;
          type: string;
        }>;
      };

      const fileTree = treeData.tree
        .filter((item) => item.type === 'blob')
        .map((item) => item.path);

      await job.updateProgress(30);

      // Redis progress event
      await emitProgress(
        projectId,
        jobId,
        30,
        'Fetching file tree...',
      );

      // Step 3: Fetch key file contents
      const keyFilePatterns = [
        'package.json',
        'requirements.txt',
        'pyproject.toml',
        'go.mod',
        'Cargo.toml',
        'pom.xml',
        'Gemfile',
        'Dockerfile',
        'docker-compose.yml',
        '.env.example',
        'next.config.js',
        'next.config.mjs',
        'next.config.ts',
        'tsconfig.json',
        'nest-cli.json',
      ];

      const keyFiles: Record<string, string> = {};

      for (const pattern of keyFilePatterns) {
        const filePath = fileTree.find(
          (f) => f === pattern || f.endsWith('/' + pattern),
        );

        if (filePath) {
          try {
            const fileResponse = await fetch(
              `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/contents/${filePath}`,
              {
                headers: {
                  Authorization: `Bearer ${account.accessToken}`,
                  Accept: 'application/vnd.github+json',
                },
              },
            );

            if (fileResponse.ok) {
              const fileData = (await fileResponse.json()) as {
                content: string;
                encoding: string;
              };

              if (fileData.encoding === 'base64') {
                keyFiles[pattern] = Buffer.from(
                  fileData.content,
                  'base64',
                ).toString('utf-8');
              }
            }
          } catch {
            // Skip files that fail to fetch
          }
        }
      }

      await job.updateProgress(50);

      // Redis progress event
      await emitProgress(
        projectId,
        jobId,
        50,
        'Reading key files...',
      );

      // Step 4: Run deterministic detector
      this.logger.log(`[${projectId}] Running detector...`);

      const { detectLanguage } =
        await import(
          '../api-shared/detectors/language.detector.js'
        );

      const { detectFramework } =
        await import(
          '../api-shared/detectors/framework.detector.js'
        );

      const { detectPackageManager } =
        await import(
          '../api-shared/detectors/package-manager.detector.js'
        );

      const ctx = {
        fileTree,
        keyFiles,
      };

      const { primaryLanguage } = detectLanguage(ctx);
      const framework = detectFramework(ctx);
      const packageManager = detectPackageManager(ctx);

      await job.updateProgress(70);

      // Redis progress event
      await emitProgress(
        projectId,
        jobId,
        70,
        'Running stack detector...',
      );

      // Step 5: Store analysis results
      await this.db.analysis.upsert({
        where: {
          projectId,
        },

        create: {
          projectId,
          status: 'COMPLETED',
          primaryLanguage: primaryLanguage as never,
          framework: framework as never,
          packageManager: packageManager as never,
          hasDockerfile: fileTree.includes('Dockerfile'),
          hasDockerCompose:
            fileTree.includes('docker-compose.yml') ||
            fileTree.includes('docker-compose.yaml'),
          hasCiCdConfig: fileTree.some((f) =>
            f.startsWith('.github/workflows/'),
          ),
          completedAt: new Date(),
        },

        update: {
          status: 'COMPLETED',
          primaryLanguage: primaryLanguage as never,
          framework: framework as never,
          packageManager: packageManager as never,
          hasDockerfile: fileTree.includes('Dockerfile'),
          hasDockerCompose:
            fileTree.includes('docker-compose.yml') ||
            fileTree.includes('docker-compose.yaml'),
          hasCiCdConfig: fileTree.some((f) =>
            f.startsWith('.github/workflows/'),
          ),
          completedAt: new Date(),
        },
      });

      await job.updateProgress(90);

      // Redis progress event
      await emitProgress(
        projectId,
        jobId,
        90,
        'Storing results...',
      );

      // Update project status
      await this.db.project.update({
        where: {
          id: projectId,
        },
        data: {
          status: 'ANALYZED',
        },
      });

      // Update job status
      await this.db.job.update({
        where: {
          id: jobId,
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          progress: 100,
        },
      });

      await job.updateProgress(100);

      // Redis completion event
      await emitCompleted(projectId, jobId);

      this.logger.log(
        `[${projectId}] Analysis complete: ${primaryLanguage}/${framework}/${packageManager}`,
      );
    } catch (error) {
      this.logger.error(
        `[${projectId}] Analysis failed:`,
        error,
      );

      // Redis failure event
      await emitFailed(
        projectId,
        jobId,
        String(error),
      );

      await this.db.job.update({
        where: {
          id: jobId,
        },
        data: {
          status: 'FAILED',
          errorMessage: String(error),
        },
      });

      await this.db.project.update({
        where: {
          id: projectId,
        },
        data: {
          status: 'FAILED',
        },
      });

      throw error;
    }
  }
}