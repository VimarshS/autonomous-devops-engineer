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
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
  },
  namespace: '/events',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  afterInit() {
    this.logger.log('WebSocket gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Client joins a project room to receive project-specific events
  @SubscribeMessage('join-project')
  handleJoinProject(
    @MessageBody() projectId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`project:${projectId}`);
    this.logger.log(`Client ${client.id} joined project:${projectId}`);
    return { event: 'joined', data: projectId };
  }

  @SubscribeMessage('leave-project')
  handleLeaveProject(
    @MessageBody() projectId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`project:${projectId}`);
    return { event: 'left', data: projectId };
  }

  // Methods called by other services to emit events
  emitToProject(projectId: string, event: string, data: unknown) {
    this.server.to(`project:${projectId}`).emit(event, data);
  }

  emitJobProgress(projectId: string, jobId: string, progress: number, message: string) {
    this.emitToProject(projectId, 'job:progress', {
      jobId,
      projectId,
      progress,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  emitJobCompleted(projectId: string, jobId: string, result?: unknown) {
    this.emitToProject(projectId, 'job:completed', {
      jobId,
      projectId,
      result,
      timestamp: new Date().toISOString(),
    });
  }

  emitJobFailed(projectId: string, jobId: string, error: string) {
    this.emitToProject(projectId, 'job:failed', {
      jobId,
      projectId,
      error,
      timestamp: new Date().toISOString(),
    });
  }

  emitProjectStatusChanged(projectId: string, status: string) {
    this.emitToProject(projectId, 'project:status', {
      projectId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  emitLogLine(projectId: string, line: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
    this.emitToProject(projectId, 'log:line', {
      projectId,
      line,
      level,
      timestamp: new Date().toISOString(),
    });
  }
}