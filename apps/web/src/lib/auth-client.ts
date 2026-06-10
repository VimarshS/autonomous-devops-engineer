import { createAuthClient } from 'better-auth/react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authClient = createAuthClient({
  baseURL: process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001',
  basePath: '/api/auth',
}) as any;