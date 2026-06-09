import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

import { DatabaseService } from '../../database/database.service';

export function createAuthConfig(db: DatabaseService) {
  return betterAuth({
    database: prismaAdapter(db, {
      provider: 'postgresql',
    }),

    basePath: '/api/auth',

    baseURL: process.env['BETTER_AUTH_URL'] ?? 'http://localhost:3001',

    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },

    socialProviders: {
      github: {
        clientId: process.env['GITHUB_CLIENT_ID'] ?? '',
        clientSecret: process.env['GITHUB_CLIENT_SECRET'] ?? '',
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },

    advanced: {
      useSecureCookies: process.env['NODE_ENV'] === 'production',
      cookiePrefix: 'ade',
    },
  });
}

export type Auth = ReturnType<typeof createAuthConfig>;