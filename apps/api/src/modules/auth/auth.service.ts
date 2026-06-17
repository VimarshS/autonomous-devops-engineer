import { Injectable, OnModuleInit } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import { createAuthConfig, type Auth } from './auth.config';

@Injectable()
export class AuthService implements OnModuleInit {
  private auth!: Auth;

  constructor(private readonly db: DatabaseService) {}

  onModuleInit() {
    this.auth = createAuthConfig(this.db);
  }

  getAuth(): Auth {
    return this.auth;
  }

  // Verify a session token — used by the JWT guard
 async verifySession(token: string) {
  return this.auth.api.getSession({
    headers: new Headers({
      cookie: `better-auth.session_token=${token}`,
    }),
  });
}
}