import { Injectable, Logger } from '@nestjs/common';
import { generateVariablesTf } from './templates/variables.tf';
import { generateVpcTf } from './templates/vpc.tf';
import { generateEcsTf } from './templates/ecs.tf';

interface TerraformGenerationInput {
  appName: string;
  region: string;
  containerPort: number;
  framework: string;
}

interface TerraformGenerationOutput {
  mainTf: string;
  variablesTf: string;
  files: Record<string, string>;
}

@Injectable()
export class TerraformService {
  private readonly logger = new Logger(TerraformService.name);

  generate(input: TerraformGenerationInput): TerraformGenerationOutput {
    this.logger.log(`Generating Terraform for ${input.appName}`);

    const variablesTf = generateVariablesTf({
      appName: input.appName,
      region: input.region,
    });

    const vpcTf = generateVpcTf();

    const ecsTf = generateEcsTf({
      appName: input.appName,
      containerPort: input.containerPort,
    });

    const mainTf = `terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

${vpcTf}

${ecsTf}
`;

    return {
      mainTf,
      variablesTf,
      files: {
        'main.tf': mainTf,
        'variables.tf': variablesTf,
      },
    };
  }
}