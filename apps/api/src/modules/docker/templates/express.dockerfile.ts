export function generateExpressDockerfile(config: {
  nodeVersion?: string;
  port?: number;
  startCommand?: string;
}): string {
  const nodeVersion = config.nodeVersion ?? '20';
  const port = config.port ?? 3000;
  const startCommand = config.startCommand ?? 'node index.js';

  return `FROM node:${nodeVersion}-alpine

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodeuser

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN chown -R nodeuser:nodejs /app
USER nodeuser

EXPOSE ${port}
CMD ["${startCommand.split(' ')[0]}", "${startCommand.split(' ').slice(1).join('", "')}"]
`;
}