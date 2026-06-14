import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

import { AuthService } from './auth.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const auth = this.authService.getAuth();
    const fullPath = `/api/auth${req.url}`;

    const headers = new Headers();

    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
    });

    try {
      // Preserve the original origin from the request
      const proto = req.get('x-forwarded-proto') || 'http';
      const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3001';
      const origin = `${proto}://${host}`;

      const response = await auth.handler(
        new Request(`${origin}${fullPath}`, {
          method: req.method,
          headers,
          body:
            req.method !== 'GET' && req.method !== 'HEAD'
              ? JSON.stringify(req.body)
              : undefined,
        }),
      );

      if (response.status === 404) {
        return next();
      }

      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      const body = await response.text();
      res.status(response.status).send(body);
    } catch (err) {
      console.error('AUTH MIDDLEWARE EXCEPTION:', err);
      next(err);
    }
  }
}