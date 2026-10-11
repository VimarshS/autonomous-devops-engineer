# Autonomous DevOps Engineer (ADE)

A full-stack SaaS platform that analyzes GitHub repositories and automatically generates production-ready DevOps infrastructure — Dockerfiles, Terraform, CI/CD pipelines, and security reports.

## Features

- **Repository Analysis** — Detects language, framework, package manager automatically
- **Docker Generation** — Production Dockerfile + docker-compose.yml
- **Terraform Generation** — AWS VPC, ECS, ALB, ECR infrastructure
- **CI/CD Generation** — GitHub Actions build + deploy workflows
- **Security Scanner** — Scores your infrastructure 0-100 with actionable findings
- **AI Troubleshooting** — Ask Gemini AI questions about your project
- **Real-time Progress** — WebSocket-powered live analysis progress

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Queue | BullMQ + Redis |
| Auth | Better Auth (GitHub OAuth + email) |
| AI | Google Gemini |
| Real-time | Socket.io + Redis pub/sub |
| Monorepo | Turborepo |

## Architecture