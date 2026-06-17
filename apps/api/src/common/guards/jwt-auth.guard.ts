import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { AuthService } from '../../modules/auth/auth.service';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

 async canActivate(context: ExecutionContext): Promise<boolean> {
  const request = context.switchToHttp().getRequest<Request>();

  if (request.path.startsWith('/api/auth')) {
    return true;
  }

  const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
    context.getHandler(),
    context.getClass(),
  ]);

  if (isPublic) {
    return true;
  }

  // Try Bearer token first
  const bearerToken = this.extractTokenFromHeader(request);
  
  // Try cookie-based session
  const cookieHeader = request.headers['cookie'] as string | undefined;
  const sessionMatch = cookieHeader?.match(/better-auth\.session_token=([^;]+)/);
  const cookieToken = sessionMatch?.[1];

  const token = bearerToken ?? cookieToken;

  if (!token) {
    throw new UnauthorizedException('No token provided');
  }

  const session = await this.authService.verifySession(token);

  if (!session) {
    throw new UnauthorizedException('Invalid or expired session');
  }

  request['user'] = session.user;

  return true;
}

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}