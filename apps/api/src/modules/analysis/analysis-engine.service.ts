import { Injectable, Logger } from '@nestjs/common';

import { detectFramework } from './detectors/framework.detector';
import { detectLanguage } from './detectors/language.detector';
import { detectPackageManager } from './detectors/package-manager.detector';
import type { DetectionContext, DetectionResult } from './detectors/detector.interface';
import { safeParseJson } from './detectors/language.detector';

@Injectable()
export class AnalysisEngineService {
  private readonly logger = new Logger(AnalysisEngineService.name);

  async analyze(ctx: DetectionContext): Promise<DetectionResult> {
    this.logger.log('Starting deterministic analysis...');

    const { primaryLanguage, languages } = detectLanguage(ctx);
    const framework = detectFramework(ctx);
    const packageManager = detectPackageManager(ctx);

    // Detect build/start/test commands from package.json
    let buildCommand: string | null = null;
    let startCommand: string | null = null;
    let testCommand: string | null = null;

    if (ctx.keyFiles['package.json']) {
      const pkg = safeParseJson(ctx.keyFiles['package.json']);
      if (pkg?.scripts) {
        const scripts = pkg.scripts as Record<string, string>;
        buildCommand = scripts['build'] ?? null;
        startCommand = scripts['start'] ?? scripts['dev'] ?? null;
        testCommand = scripts['test'] ?? null;
      }
    }

    // Detect databases from dependencies
    const databases: string[] = [];
    let hasRedis = false;

    if (ctx.keyFiles['package.json']) {
      const pkg = safeParseJson(ctx.keyFiles['package.json']);
      const allDeps = {
        ...((pkg?.dependencies as Record<string, string>) ?? {}),
        ...((pkg?.devDependencies as Record<string, string>) ?? {}),
      };

      if (allDeps['pg'] || allDeps['@prisma/client'] || allDeps['typeorm']) {
        databases.push('POSTGRESQL');
      }
      if (allDeps['mongoose'] || allDeps['mongodb']) {
        databases.push('MONGODB');
      }
      if (allDeps['mysql2'] || allDeps['mysql']) {
        databases.push('MYSQL');
      }
      if (allDeps['ioredis'] || allDeps['redis']) {
        hasRedis = true;
      }
    }

    // Detect ports from common framework defaults
    const ports: number[] = [];
    if (framework === 'NEXTJS') ports.push(3000);
    if (framework === 'NESTJS') ports.push(3001);
    if (framework === 'EXPRESS' || framework === 'FASTIFY') ports.push(3000);
    if (framework === 'DJANGO') ports.push(8000);
    if (framework === 'FASTAPI') ports.push(8000);
    if (framework === 'FLASK') ports.push(5000);
    if (framework === 'SPRING_BOOT') ports.push(8080);
    if (framework === 'RAILS') ports.push(3000);

    // Detect env vars from .env.example
    const detectedEnvVars: Array<{ key: string; required: boolean; isSensitive: boolean }> = [];
    const envExample = ctx.keyFiles['.env.example'] ?? ctx.keyFiles['.env.sample'] ?? '';

    if (envExample) {
      const lines = envExample.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key] = trimmed.split('=');
        if (key) {
          const keyName = key.trim();
          const isSensitive =
            keyName.includes('SECRET') ||
            keyName.includes('KEY') ||
            keyName.includes('PASSWORD') ||
            keyName.includes('TOKEN');

          detectedEnvVars.push({
            key: keyName,
            required: true,
            isSensitive,
          });
        }
      }
    }

    const hasDockerfile = ctx.fileTree.includes('Dockerfile');
    const hasDockerCompose =
      ctx.fileTree.includes('docker-compose.yml') ||
      ctx.fileTree.includes('docker-compose.yaml');
    const hasCiCdConfig =
      ctx.fileTree.some(f => f.startsWith('.github/workflows/')) ||
      ctx.fileTree.includes('.gitlab-ci.yml') ||
      ctx.fileTree.includes('Jenkinsfile');

    this.logger.log(
      `Analysis complete: ${primaryLanguage} / ${framework} / ${packageManager}`,
    );

    return {
      primaryLanguage,
      languages,
      framework,
      packageManager,
      databases,
      hasRedis,
      ports,
      buildCommand,
      startCommand,
      testCommand,
      hasDockerfile,
      hasDockerCompose,
      hasCiCdConfig,
      detectedEnvVars,
    };
  }
}