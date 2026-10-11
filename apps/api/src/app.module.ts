// import { Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';

import { ProjectsModule } from './modules/projects/projects.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { GitHubModule } from './modules/github/github.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { DockerModule } from './modules/docker/docker.module';
import { TerraformModule } from './modules/terraform/terraform.module';
import { CiCdModule } from './modules/cicd/cicd.module';
import { ArtifactsModule } from './modules/artifacts/artifacts.module'
import { SecurityModule } from './modules/security/security.module';
import { AiModule } from './modules/ai/ai.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggingMiddleware } from './common/middleware/logging.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // BullMQ / Redis
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),

    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 5,
      },
      {
        name: 'medium',
        ttl: 60000,
        limit: 20,
      },
    ]),

    HealthModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    GatewayModule,
    GitHubModule,
    AnalysisModule,
    DockerModule,
    TerraformModule,
    CiCdModule,
    ArtifactsModule,
    SecurityModule,
    AiModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}