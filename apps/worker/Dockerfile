FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/worker/package*.json ./apps/worker/
COPY packages/database/package*.json ./packages/database/
COPY packages/config/package*.json ./packages/config/
RUN npm ci
COPY . .
RUN cd packages/database && npx prisma generate
RUN cd apps/worker && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/package.json ./apps/worker/package.json
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/package.json ./package.json
CMD ["node", "apps/worker/dist/main"]