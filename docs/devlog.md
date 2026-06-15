# devlog.md — Autonomous DevOps Engineer

## Project Overview
**Product:** Autonomous DevOps Engineer  
**Stack:** NestJS + Next.js + PostgreSQL + Redis + BullMQ  
**Repo:** monorepo (Turborepo)

---

## Phase Progress

| Phase | Status |
|---|---|
| Phase 0 — Planning | ✅ Complete |
| Phase 1 — Scaffolding | ✅ Complete |
| Phase 2 — Authentication | ⏳ Next |

---

## Session Log

### Session 0 — Planning
- Defined full roadmap (16 phases)
- Designed system architecture
- Created devlog, architecture.md, ROADMAP.md

### Session 1 — Phase 1 Scaffolding
- Initialized Turborepo monorepo
- Created packages/types (shared enums + interfaces)
- Created packages/config (shared ESLint + tsconfig)
- Initialized NestJS API with health endpoint
- Initialized Next.js frontend
- Designed and migrated full Prisma schema (9 models)
- Docker Compose with PostgreSQL + Redis
- NestJS Worker with 6 BullMQ queues

---

## Architecture Decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Monorepo | Turborepo |
| 2 | Backend | NestJS + TypeScript |
| 3 | Frontend | Next.js 14 + Tailwind |
| 4 | Database | PostgreSQL via Prisma 6 |
| 5 | Queue | BullMQ + Redis |
| 6 | Analysis storage | Hybrid (relational + JSON) |
| 7 | Artifacts | Versioned, append-only |
| 8 | Deployments | Append-only history |
| 9 | Audit log | ProjectEvent table |

---

## Known Issues / Technical Debt
- Tailwind CSS warnings in VS Code (cosmetic only)
- `version` attribute in docker-compose.dev.yml (obsolete warning)
- Worker `.env` not validated with Zod yet (Phase 15)

---

## Next Session Goals — Phase 2
1. Set up Better Auth in NestJS
2. GitHub OAuth flow
3. JWT + refresh token strategy
4. Auth guards and decorators
5. Login/signup pages in Next.js

# Update docs/devlog.md to reflect Phase 2 completion

### Session 2 — Phase 2 Authentication
**Status:** ✅ Complete

#### What was done
- Installed and configured Better Auth with Prisma adapter
- GitHub OAuth App registered and wired
- JWT AuthGuard + CurrentUser decorator
- Users module with GET/PATCH /users/me
- Login and register pages
- Auth state management with React context
- Next.js middleware for protected routes
- Rate limiting with ThrottlerModule
- Fixed session cookie issue (basePath was /api/auth, needed /api/v1/auth)
- Next.js proxy route for same-origin cookie handling

#### Key Decision
Better Auth requires basePath to match the actual NestJS versioned route.
Cross-origin cookies require a Next.js proxy route to handle auth requests
on the same origin as the frontend.

#### Next Session Goals — Phase 3
1. Projects CRUD API
2. Project status state machine
3. Dashboard layout with sidebar
4. Projects list and create pages
5. WebSocket gateway for real-time updates