import { createAuthClient } from 'better-auth/react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  basePath: '/api/auth',
  fetchOptions: {
    credentials: 'include',
  },
}) as any;

export const tokenStorage = {
  set: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ade_token', token);
    }
  },
  get: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ade_token');
    }
    return null;
  },
  remove: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ade_token');
    }
  },
};