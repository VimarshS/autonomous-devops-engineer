'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface JobProgressEvent {
  jobId: string;
  projectId: string;
  progress: number;
  message: string;
  timestamp: string;
}

interface ProjectStatusEvent {
  projectId: string;
  status: string;
  timestamp: string;
}

interface UseProjectSocketOptions {
  projectId: string;
  onJobProgress?: (event: JobProgressEvent) => void;
  onJobCompleted?: (event: { jobId: string; projectId: string }) => void;
  onJobFailed?: (event: { jobId: string; projectId: string; error: string }) => void;
  onStatusChanged?: (event: ProjectStatusEvent) => void;
  onLogLine?: (event: { projectId: string; line: string; level: string }) => void;
}

export function useProjectSocket({
  projectId,
  onJobProgress,
  onJobCompleted,
  onJobFailed,
  onStatusChanged,
  onLogLine,
}: UseProjectSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    const socket = io('http://localhost:3001/events', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
      socket.emit('join-project', projectId);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    if (onJobProgress) socket.on('job:progress', onJobProgress);
    if (onJobCompleted) socket.on('job:completed', onJobCompleted);
    if (onJobFailed) socket.on('job:failed', onJobFailed);
    if (onStatusChanged) socket.on('project:status', onStatusChanged);
    if (onLogLine) socket.on('log:line', onLogLine);

    socketRef.current = socket;
  }, [projectId]);

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-project', projectId);
        socketRef.current.disconnect();
      }
    };
  }, [connect, projectId]);

  return socketRef.current;
}