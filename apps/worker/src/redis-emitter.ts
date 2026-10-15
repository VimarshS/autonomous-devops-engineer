import Redis from 'ioredis';

let redisClient: Redis | null = null;

function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env['REDIS_HOST'] ?? 'localhost',
      port: parseInt(process.env['REDIS_PORT'] ?? '6379'),
      password: process.env['REDIS_PASSWORD'] ?? undefined,
      tls: process.env['NODE_ENV'] === 'production' ? {} : undefined,
    });
  }
  return redisClient;
}

export async function emitProgress(
  projectId: string,
  jobId: string,
  progress: number,
  message: string,
) {
  await getRedis().publish(
    'job:progress',
    JSON.stringify({ projectId, jobId, progress, message }),
  );
}

export async function emitCompleted(projectId: string, jobId: string) {
  await getRedis().publish(
    'job:completed',
    JSON.stringify({ projectId, jobId }),
  );
}

export async function emitFailed(projectId: string, jobId: string, error: string) {
  await getRedis().publish(
    'job:failed',
    JSON.stringify({ projectId, jobId, error }),
  );
}