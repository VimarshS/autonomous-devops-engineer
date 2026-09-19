import { Injectable, Logger } from '@nestjs/common';

interface SecurityFinding {
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  category: 'DEPENDENCY' | 'SECRETS' | 'DOCKERFILE' | 'TERRAFORM' | 'CODE';
  file: string | null;
  line: number | null;
  recommendation: string;
}

interface SecurityScanInput {
  artifacts: Array<{ type: string; filename: string; content: string }>;
  envVars: Array<{ key: string }>;
}

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  scan(input: SecurityScanInput): {
    findings: SecurityFinding[];
    score: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  } {
    this.logger.log('Running security scan...');
    const findings: SecurityFinding[] = [];

    for (const artifact of input.artifacts) {
      if (artifact.type === 'DOCKERFILE') {
        findings.push(...this.scanDockerfile(artifact.content, artifact.filename));
      }
      if (artifact.type === 'TERRAFORM_MAIN') {
        findings.push(...this.scanTerraform(artifact.content, artifact.filename));
      }
    }

    findings.push(...this.scanEnvVars(input.envVars));

    const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
    const highCount = findings.filter(f => f.severity === 'HIGH').length;
    const mediumCount = findings.filter(f => f.severity === 'MEDIUM').length;
    const lowCount = findings.filter(f => f.severity === 'LOW').length;

    const score = Math.max(0, 100 - (criticalCount * 25) - (highCount * 10) - (mediumCount * 5) - (lowCount * 2));

    return { findings, score, criticalCount, highCount, mediumCount, lowCount };
  }

  private scanDockerfile(content: string, filename: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const lines = content.split('\n');

    lines.forEach((line, i) => {
      // Check for root user
      if (line.match(/^USER\s+root/i)) {
        findings.push({
          title: 'Container running as root',
          description: 'Container is configured to run as root user',
          severity: 'HIGH',
          category: 'DOCKERFILE',
          file: filename,
          line: i + 1,
          recommendation: 'Add a non-root user and use USER instruction',
        });
      }

      // Check for latest tag
      if (line.match(/^FROM\s+\S+:latest/i)) {
        findings.push({
          title: 'Using latest tag',
          description: 'Using :latest tag makes builds non-reproducible',
          severity: 'MEDIUM',
          category: 'DOCKERFILE',
          file: filename,
          line: i + 1,
          recommendation: 'Pin to a specific version tag',
        });
      }

      // Check for secrets in ENV
      if (line.match(/^ENV\s+.*(SECRET|PASSWORD|KEY|TOKEN)/i)) {
        findings.push({
          title: 'Potential secret in Dockerfile',
          description: 'Hardcoded secret detected in ENV instruction',
          severity: 'CRITICAL',
          category: 'SECRETS',
          file: filename,
          line: i + 1,
          recommendation: 'Use Docker secrets or environment variables at runtime',
        });
      }

      // Check for ADD instead of COPY
      if (line.match(/^ADD\s+/i) && !line.includes('http')) {
        findings.push({
          title: 'Using ADD instead of COPY',
          description: 'ADD has unexpected behaviors; COPY is more explicit',
          severity: 'LOW',
          category: 'DOCKERFILE',
          file: filename,
          line: i + 1,
          recommendation: 'Use COPY instead of ADD for local files',
        });
      }
    });

    // Check for no healthcheck
    if (!content.includes('HEALTHCHECK')) {
      findings.push({
        title: 'No HEALTHCHECK defined',
        description: 'Container has no health check configured',
        severity: 'LOW',
        category: 'DOCKERFILE',
        file: filename,
        line: null,
        recommendation: 'Add a HEALTHCHECK instruction',
      });
    }

    return findings;
  }

  private scanTerraform(content: string, filename: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    // Check for open security groups
    if (content.includes('cidr_blocks = ["0.0.0.0/0"]') && content.includes('from_port   = 0')) {
      findings.push({
        title: 'Overly permissive security group',
        description: 'Security group allows all inbound traffic on all ports',
        severity: 'HIGH',
        category: 'TERRAFORM',
        file: filename,
        line: null,
        recommendation: 'Restrict inbound rules to only required ports and IPs',
      });
    }

    // Check for public S3
    if (content.includes('acl = "public-read"') || content.includes('acl = "public-read-write"')) {
      findings.push({
        title: 'Public S3 bucket',
        description: 'S3 bucket is configured with public access',
        severity: 'CRITICAL',
        category: 'TERRAFORM',
        file: filename,
        line: null,
        recommendation: 'Set bucket ACL to private and use pre-signed URLs',
      });
    }

    // Check for unencrypted RDS
    if (content.includes('aws_db_instance') && !content.includes('storage_encrypted = true')) {
      findings.push({
        title: 'RDS storage not encrypted',
        description: 'Database storage encryption is not enabled',
        severity: 'HIGH',
        category: 'TERRAFORM',
        file: filename,
        line: null,
        recommendation: 'Set storage_encrypted = true on aws_db_instance',
      });
    }

    return findings;
  }

  private scanEnvVars(envVars: Array<{ key: string }>): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const sensitivePatterns = ['SECRET', 'PASSWORD', 'PRIVATE_KEY', 'API_KEY', 'TOKEN', 'CREDENTIALS'];

    for (const { key } of envVars) {
      if (sensitivePatterns.some(p => key.toUpperCase().includes(p))) {
        findings.push({
          title: `Sensitive env var: ${key}`,
          description: `Environment variable ${key} appears to contain sensitive data`,
          severity: 'INFO',
          category: 'SECRETS',
          file: null,
          line: null,
          recommendation: 'Ensure this value is stored in a secrets manager, not hardcoded',
        });
      }
    }

    return findings;
  }
}