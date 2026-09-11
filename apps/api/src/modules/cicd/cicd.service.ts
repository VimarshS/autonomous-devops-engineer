import { Injectable, Logger } from '@nestjs/common';
import { generateBuildTestWorkflow } from './templates/build-test.yml';
import { generateDeployEcsWorkflow } from './templates/deploy-ecs.yml';

interface CiCdGenerationInput {
  appName: string;
  region: string;
  framework: string;
  packageManager: string;
  testCommand: string | null;
  buildCommand: string | null;
  containerPort: number;
}

@Injectable()
export class CiCdService {
  private readonly logger = new Logger(CiCdService.name);

  generate(input: CiCdGenerationInput) {
    this.logger.log(`Generating CI/CD for ${input.appName}`);

    const buildTest = generateBuildTestWorkflow({
      packageManager: input.packageManager,
      testCommand: input.testCommand ?? undefined,
      buildCommand: input.buildCommand ?? undefined,
    });

    const deployEcs = generateDeployEcsWorkflow({
      appName: input.appName,
      region: input.region,
      containerPort: input.containerPort,
    });

    return {
      buildTest,
      deployEcs,
      files: {
        '.github/workflows/build-test.yml': buildTest,
        '.github/workflows/deploy-ecs.yml': deployEcs,
      },
    };
  }
}