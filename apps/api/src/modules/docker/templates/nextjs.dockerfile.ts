export function generateNextjsDockerfile(config: {
  nodeVersion?: string;
  port?: number;
}): string {
  const nodeVersion = config.nodeVersion ?? '20';
  const port = config.port ?? 3000;

  return `# Stage 1: Dependencies
FROM node:${nodeVersion}-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Builder
FROM node:${nodeVersion}-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Runner
FROM node:${nodeVersion}-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE ${port}
ENV PORT ${port}
CMD ["node", "server.js"]
`;
}

export function generateNextjsDockerCompose(config: {
  port?: number;
  appName?: string;
}): string {
  const port = config.port ?? 3000;
  const appName = config.appName ?? 'app';

  return `version: '3.9'

services:
  ${appName}:
    build: .
    ports:
      - "${port}:${port}"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
`;
}