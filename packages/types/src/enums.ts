export enum ProjectStatus {
  DRAFT = 'DRAFT',
  ANALYZING = 'ANALYZING',
  ANALYZED = 'ANALYZED',
  GENERATING = 'GENERATING',
  GENERATED = 'GENERATED',
  DEPLOYING = 'DEPLOYING',
  LIVE = 'LIVE',
  FAILED = 'FAILED',
  PAUSED = 'PAUSED',
}

export enum JobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
  CANCELLED = 'CANCELLED',
}

export enum ProgrammingLanguage {
  TYPESCRIPT = 'TYPESCRIPT',
  JAVASCRIPT = 'JAVASCRIPT',
  PYTHON = 'PYTHON',
  GO = 'GO',
  RUST = 'RUST',
  JAVA = 'JAVA',
  RUBY = 'RUBY',
  PHP = 'PHP',
  UNKNOWN = 'UNKNOWN',
}

export enum Framework {
  NEXTJS = 'NEXTJS',
  NESTJS = 'NESTJS',
  EXPRESS = 'EXPRESS',
  FASTIFY = 'FASTIFY',
  FASTAPI = 'FASTAPI',
  DJANGO = 'DJANGO',
  FLASK = 'FLASK',
  GIN = 'GIN',
  SPRING_BOOT = 'SPRING_BOOT',
  RAILS = 'RAILS',
  UNKNOWN = 'UNKNOWN',
}

export enum PackageManager {
  NPM = 'NPM',
  YARN = 'YARN',
  PNPM = 'PNPM',
  BUN = 'BUN',
  PIP = 'PIP',
  POETRY = 'POETRY',
  GO_MOD = 'GO_MOD',
  CARGO = 'CARGO',
  UNKNOWN = 'UNKNOWN',
}

export enum DeploymentTarget {
  ECS = 'ECS',
  EKS = 'EKS',
  LAMBDA = 'LAMBDA',
}

export enum DatabaseService {
  POSTGRESQL = 'POSTGRESQL',
  MYSQL = 'MYSQL',
  MONGODB = 'MONGODB',
  REDIS = 'REDIS',
  SQLITE = 'SQLITE',
}

export enum SecuritySeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO',
}

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}