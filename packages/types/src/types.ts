import type {
  DatabaseService,
  DeploymentTarget,
  Framework,
  JobStatus,
  PackageManager,
  ProgrammingLanguage,
  ProjectStatus,
  SecuritySeverity,
  UserRole,
} from './enums';

// ─────────────────────────────────────
// API Response envelope
// ─────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  requestId?: string;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─────────────────────────────────────
// User
// ─────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
}

// ─────────────────────────────────────
// Project
// ─────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  repositoryUrl: string | null;
  repositoryOwner: string | null;
  repositoryName: string | null;
  deployedUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  repositoryUrl?: string;
}

// ─────────────────────────────────────
// Analysis
// ─────────────────────────────────────

export interface AnalysisResult {
  id: string;
  projectId: string;
  status: JobStatus;
  primaryLanguage: ProgrammingLanguage;
  framework: Framework;
  packageManager: PackageManager;
  databases: DatabaseService[];
  ports: number[];
  buildCommand: string | null;
  startCommand: string | null;
  hasDockerfile: boolean;
  hasDockerCompose: boolean;
  aiSummary: string | null;
  deploymentComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
}

// ─────────────────────────────────────
// Deployment
// ─────────────────────────────────────

export interface Deployment {
  id: string;
  projectId: string;
  status: JobStatus;
  target: DeploymentTarget;
  region: string;
  deployedUrl: string | null;
  startedAt: string;
  completedAt: string | null;
}

// ─────────────────────────────────────
// Security
// ─────────────────────────────────────

export interface SecurityFinding {
  id: string;
  title: string;
  description: string;
  severity: SecuritySeverity;
  category: 'DEPENDENCY' | 'SECRETS' | 'DOCKERFILE' | 'TERRAFORM' | 'CODE';
  file: string | null;
  line: number | null;
  recommendation: string;
}

// ─────────────────────────────────────
// WebSocket events
// ─────────────────────────────────────

export type WebSocketEvent =
  | { type: 'JOB_STARTED'; payload: { jobId: string; projectId: string; jobType: string } }
  | { type: 'JOB_PROGRESS'; payload: { jobId: string; projectId: string; progress: number; message: string } }
  | { type: 'JOB_COMPLETED'; payload: { jobId: string; projectId: string } }
  | { type: 'JOB_FAILED'; payload: { jobId: string; projectId: string; error: string } }
  | { type: 'PROJECT_STATUS_CHANGED'; payload: { projectId: string; status: ProjectStatus } }
  | { type: 'LOG_LINE'; payload: { projectId: string; line: string; level: 'INFO' | 'WARN' | 'ERROR' } };