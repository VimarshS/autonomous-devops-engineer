import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

export enum QueueName {
  ANALYSIS = 'analysis',
  DOCKER = 'docker',
  TERRAFORM = 'terraform',
  CICD = 'cicd',
  DEPLOYMENT = 'deployment',
  SECURITY = 'security',
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 200 },
        },
      }),
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
})
export class WorkerModule {}