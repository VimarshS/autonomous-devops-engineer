'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { tokenStorage } from '../lib/auth-client';

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refetch: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

async function fetchSession() {
  try {
    const response = await fetch('/api/auth/get-session', {
      credentials: 'include',
    });

    const data = await response.json();
    console.log('SESSION DATA:', JSON.stringify(data));
    setUser(data?.user ?? null);
  } catch (err) {
    console.error('Session fetch error:', err);
    setUser(null);
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    void fetchSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refetch: fetchSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}