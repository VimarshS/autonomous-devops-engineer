import { All, Controller, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @All('*')
  @Public()
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    const auth = this.authService.getAuth();

    // Preserve the original origin from the request (for Better Auth origin validation)
    const proto = req.get('x-forwarded-proto') || 'http';
    const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3001';
    const origin = `${proto}://${host}`;

    // req.url already includes the full path starting with /api/v1/auth/...
    // Better Auth expects the full URL with the basePath included
    const fullUrl = `${origin}${req.url}`;

    console.log(`[AUTH] ${req.method} ${req.path}`);
    console.log(`[AUTH] Origin: ${origin}, URL: ${fullUrl}`);
    console.log(`[AUTH] Cookies: ${req.headers.cookie || 'none'}`);

    const response = await auth.handler(
      new Request(fullUrl, {
        method: req.method,
        headers: req.headers as HeadersInit,
        body:
          req.method !== 'GET' && req.method !== 'HEAD'
            ? JSON.stringify(req.body)
            : undefined,
      }),
    );

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const body = await response.text();
    console.log(`[AUTH] Response status: ${response.status}, body length: ${body.length}`);
    if (req.path === '/api/v1/auth/get-session') {
      console.log(`[AUTH] GET-SESSION response: ${body}`);
    }
    res.status(response.status).send(body);
  }
}