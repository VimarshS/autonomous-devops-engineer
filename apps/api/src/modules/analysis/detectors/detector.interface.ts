export interface DetectionContext {
  fileTree: string[];
  keyFiles: Record<string, string>; // filename -> content
}

export interface DetectionResult {
  primaryLanguage: string;
  languages: string[];
  framework: string;
  packageManager: string;
  databases: string[];
  hasRedis: boolean;
  ports: number[];
  buildCommand: string | null;
  startCommand: string | null;
  testCommand: string | null;
  hasDockerfile: boolean;
  hasDockerCompose: boolean;
  hasCiCdConfig: boolean;
  detectedEnvVars: DetectedEnvVar[];
}

export interface DetectedEnvVar {
  key: string;
  required: boolean;
  isSensitive: boolean;
}