import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import {
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
  },
  namespace: '/events',
})
export class EventsGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit,
    OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  private subscriber: Redis;

  afterInit() {
    this.logger.log('WebSocket gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // --------------------------------------------------
  // Redis subscriber
  // --------------------------------------------------

  onModuleInit() {
  this.subscriber = new Redis({
    host: process.env['REDIS_HOST'] ?? 'localhost',
    port: parseInt(process.env['REDIS_PORT'] ?? '6379'),
    password: process.env['REDIS_PASSWORD'] ?? undefined,
    tls: process.env['NODE_ENV'] === 'production' ? {} : undefined,
  });

    this.subscriber.subscribe(
      'job:progress',
      'job:completed',
      'job:failed',
    );

    this.subscriber.on(
      'message',
      (channel: string, message: string) => {
        try {
          const data = JSON.parse(message) as {
            projectId: string;
            jobId: string;
            progress?: number;
            message?: string;
            error?: string;
          };

          if (channel === 'job:progress') {
            this.emitJobProgress(
              data.projectId,
              data.jobId,
              data.progress ?? 0,
              data.message ?? '',
            );
          } else if (channel === 'job:completed') {
            this.emitJobCompleted(
              data.projectId,
              data.jobId,
            );
          } else if (channel === 'job:failed') {
            this.emitJobFailed(
              data.projectId,
              data.jobId,
              data.error ?? 'Unknown error',
            );
          }
        } catch (error) {
          this.logger.error(
            'Failed to process Redis job event',
            error,
          );
        }
      },
    );

    this.subscriber.on('error', (error) => {
      this.logger.error(
        'Redis subscriber error',
        error,
      );
    });

    this.logger.log(
      'Redis subscriber connected for job events',
    );
  }

  onModuleDestroy() {
    this.subscriber?.disconnect();

    this.logger.log(
      'Redis subscriber disconnected',
    );
  }

  // --------------------------------------------------
  // Project rooms
  // --------------------------------------------------

  // Client joins a project room to receive project-specific events
  @SubscribeMessage('join-project')
  handleJoinProject(
    @MessageBody() projectId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`project:${projectId}`);

    this.logger.log(
      `Client ${client.id} joined project:${projectId}`,
    );

    return {
      event: 'joined',
      data: projectId,
    };
  }

  @SubscribeMessage('leave-project')
  handleLeaveProject(
    @MessageBody() projectId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`project:${projectId}`);

    return {
      event: 'left',
      data: projectId,
    };
  }

  // --------------------------------------------------
  // WebSocket event helpers
  // --------------------------------------------------

  // Methods called by other services to emit events
  emitToProject(
    projectId: string,
    event: string,
    data: unknown,
  ) {
    this.server
      .to(`project:${projectId}`)
      .emit(event, data);
  }

  emitJobProgress(
    projectId: string,
    jobId: string,
    progress: number,
    message: string,
  ) {
    this.emitToProject(
      projectId,
      'job:progress',
      {
        jobId,
        projectId,
        progress,
        message,
        timestamp: new Date().toISOString(),
      },
    );
  }

  emitJobCompleted(
    projectId: string,
    jobId: string,
    result?: unknown,
  ) {
    this.emitToProject(
      projectId,
      'job:completed',
      {
        jobId,
        projectId,
        result,
        timestamp: new Date().toISOString(),
      },
    );
  }

  emitJobFailed(
    projectId: string,
    jobId: string,
    error: string,
  ) {
    this.emitToProject(
      projectId,
      'job:failed',
      {
        jobId,
        projectId,
        error,
        timestamp: new Date().toISOString(),
      },
    );
  }

  emitProjectStatusChanged(
    projectId: string,
    status: string,
  ) {
    this.emitToProject(
      projectId,
      'project:status',
      {
        projectId,
        status,
        timestamp: new Date().toISOString(),
      },
    );
  }

  emitLogLine(
    projectId: string,
    line: string,
    level: 'INFO' | 'WARN' | 'ERROR' = 'INFO',
  ) {
    this.emitToProject(
      projectId,
      'log:line',
      {
        projectId,
        line,
        level,
        timestamp: new Date().toISOString(),
      },
    );
  }
}