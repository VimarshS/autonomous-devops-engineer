import { safeParseJson } from './language.detector';
import type { DetectionContext } from './detector.interface';

export function detectFramework(ctx: DetectionContext): string {
  const { keyFiles } = ctx;

  // Node.js frameworks — check package.json dependencies
  if (keyFiles['package.json']) {
    const pkg = safeParseJson(keyFiles['package.json']);
    if (pkg) {
      const deps = {
        ...((pkg.dependencies as Record<string, string>) ?? {}),
        ...((pkg.devDependencies as Record<string, string>) ?? {}),
      };

      if (deps['next']) return 'NEXTJS';
      if (deps['@nestjs/core']) return 'NESTJS';
      if (deps['fastify']) return 'FASTIFY';
      if (deps['express']) return 'EXPRESS';
      if (deps['@remix-run/node'] || deps['@remix-run/react']) return 'REMIX';
    }
  }

  // Next.js config files
  if (
    keyFiles['next.config.js'] ||
    keyFiles['next.config.ts'] ||
    keyFiles['next.config.mjs']
  ) {
    return 'NEXTJS';
  }

  // Python frameworks
  if (keyFiles['requirements.txt'] || keyFiles['pyproject.toml']) {
    const content =
      keyFiles['requirements.txt'] ?? keyFiles['pyproject.toml'] ?? '';

    if (content.includes('fastapi')) return 'FASTAPI';
    if (content.includes('django')) return 'DJANGO';
    if (content.includes('flask')) return 'FLASK';
  }

  // Go frameworks
  if (keyFiles['go.mod']) {
    const content = keyFiles['go.mod'];
    if (content.includes('gin-gonic/gin')) return 'GIN';
    if (content.includes('labstack/echo')) return 'ECHO';
    if (content.includes('gofiber/fiber')) return 'FIBER';
  }

  // Java frameworks
  if (keyFiles['pom.xml']) {
    const content = keyFiles['pom.xml'];
    if (content.includes('spring-boot')) return 'SPRING_BOOT';
  }

  // Ruby on Rails
  if (keyFiles['Gemfile']) {
    const content = keyFiles['Gemfile'];
    if (content.includes('rails')) return 'RAILS';
  }

  return 'UNKNOWN';
}