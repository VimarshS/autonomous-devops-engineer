
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { z } from 'zod';

import { AnalysisWorker } from './workers/analysis.worker';

export enum QueueName {
  ANALYSIS = 'analysis',
  DOCKER = 'docker',
  TERRAFORM = 'terraform',
  CICD = 'cicd',
  DEPLOYMENT = 'deployment',
  SECURITY = 'security',
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  GITHUB_TOKEN_ENCRYPTION_KEY: z.string().optional(),
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config: Record<string, unknown>) => {
        const result = envSchema.safeParse(config);

        if (!result.success) {
          throw new Error(
            `Worker env validation failed: ${result.error.message}`,
          );
        }

        return result.data;
      },
    }),

    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('REDIS_HOST', 'localhost');
        const port = config.get<number>('REDIS_PORT', 6379);
        const password = config.get<string>('REDIS_PASSWORD');

        return {
          connection: {
            host,
            port,
            ...(password ? { password } : {}),
            tls: host.endsWith('.upstash.io') ? {} : undefined,
          },
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 200 },
          },
        };
      },
      inject: [ConfigService],
    }),

    BullModule.registerQueue(
      { name: QueueName.ANALYSIS },
      { name: QueueName.DOCKER },
      { name: QueueName.TERRAFORM },
      { name: QueueName.CICD },
      { name: QueueName.DEPLOYMENT },
      { name: QueueName.SECURITY },
    ),
  ],
  providers: [AnalysisWorker],
})
export class WorkerModule {}
