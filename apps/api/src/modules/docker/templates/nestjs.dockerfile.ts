export function generateNestjsDockerfile(config: {
  nodeVersion?: string;
  port?: number;
}): string {
  const nodeVersion = config.nodeVersion ?? '20';
  const port = config.port ?? 3000;

  return `# Stage 1: Build
FROM node:${nodeVersion}-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:${nodeVersion}-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
USER nestjs
EXPOSE ${port}
CMD ["node", "dist/main"]
`;
}