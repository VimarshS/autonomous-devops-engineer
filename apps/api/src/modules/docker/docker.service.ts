import { Injectable, Logger } from '@nestjs/common';

import { generateNextjsDockerfile, generateNextjsDockerCompose } from './templates/nextjs.dockerfile';
import { generateNestjsDockerfile } from './templates/nestjs.dockerfile';
import { generateFastapiDockerfile } from './templates/fastapi.dockerfile';
import { generateExpressDockerfile } from './templates/express.dockerfile';

interface DockerGenerationInput {
  framework: string;
  packageManager: string;
  ports: number[];
  startCommand: string | null;
  buildCommand: string | null;
  appName?: string;
}

interface DockerGenerationOutput {
  dockerfile: string;
  dockerCompose: string;
  framework: string;
}

@Injectable()
export class DockerService {
  private readonly logger = new Logger(DockerService.name);

  generate(input: DockerGenerationInput): DockerGenerationOutput {
    const port = input.ports[0] ?? 3000;
    const appName = input.appName ?? 'app';

    this.logger.log(`Generating Dockerfile for ${input.framework}`);

    let dockerfile: string;

    switch (input.framework) {
      case 'NEXTJS':
        dockerfile = generateNextjsDockerfile({ port });
        break;
      case 'NESTJS':
        dockerfile = generateNestjsDockerfile({ port });
        break;
      case 'FASTAPI':
        dockerfile = generateFastapiDockerfile({ port });
        break;
      case 'EXPRESS':
      case 'FASTIFY':
        dockerfile = generateExpressDockerfile({
          port,
          startCommand: input.startCommand ?? undefined,
        });
        break;
      default:
        // Generic Node.js fallback
        dockerfile = generateExpressDockerfile({ port });
    }

    const dockerCompose = generateNextjsDockerCompose({ port, appName });

    return { dockerfile, dockerCompose, framework: input.framework };
  }
}