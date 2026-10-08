import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface TroubleshootContext {
  projectName: string;
  framework: string;
  language: string;
  packageManager: string;
  hasDockerfile: boolean;
  securityFindings?: Array<{
    title: string;
    severity: string;
    description: string;
    recommendation: string;
  }>;
  artifacts?: Array<{
    filename: string;
    content: string;
  }>;
  errorMessage?: string;
  question: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(
      process.env['GEMINI_API_KEY'] ?? '',
    );
  }

  async troubleshoot(ctx: TroubleshootContext): Promise<string> {
    this.logger.log(`AI troubleshoot request for ${ctx.projectName}`);

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-3.8-flash',
      systemInstruction: `You are an expert DevOps engineer and cloud architect helping developers deploy their applications. 
You have deep knowledge of Docker, Terraform, AWS ECS, GitHub Actions, and common deployment issues.
Be concise, practical, and give specific actionable advice.
Format your response with clear sections using markdown.`,
    });

    const prompt = this.buildPrompt(ctx);
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  private buildPrompt(ctx: TroubleshootContext): string {
    const parts: string[] = [];

    parts.push(`## Project Context`);
    parts.push(`- Name: ${ctx.projectName}`);
    parts.push(`- Framework: ${ctx.framework}`);
    parts.push(`- Language: ${ctx.language}`);
    parts.push(`- Package Manager: ${ctx.packageManager}`);
    parts.push(`- Has Dockerfile: ${ctx.hasDockerfile}`);

    if (ctx.errorMessage) {
      parts.push(`\n## Error\n\`\`\`\n${ctx.errorMessage}\n\`\`\``);
    }

    if (ctx.securityFindings && ctx.securityFindings.length > 0) {
      parts.push(`\n## Security Findings`);
      for (const f of ctx.securityFindings.slice(0, 5)) {
        parts.push(`- [${f.severity}] ${f.title}: ${f.description}`);
      }
    }

    if (ctx.artifacts && ctx.artifacts.length > 0) {
      parts.push(`\n## Generated Files`);
      for (const a of ctx.artifacts.slice(0, 3)) {
        parts.push(`\n### ${a.filename}\n\`\`\`\n${a.content.slice(0, 500)}\n\`\`\``);
      }
    }

    parts.push(`\n## Question\n${ctx.question}`);

    return parts.join('\n');
  }
}