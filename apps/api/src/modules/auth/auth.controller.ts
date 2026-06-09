import { All, Controller, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @All('*')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    const auth = this.authService.getAuth();

    const response = await auth.handler(
      new Request(`http://localhost${req.url}`, {
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
    res.status(response.status).send(body);
  }
}