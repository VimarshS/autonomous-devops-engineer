'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { authClient, tokenStorage } from '../../../lib/auth-client';
import { useAuth } from '../../../contexts/auth-context';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  async function handleSignOut() {
    tokenStorage.remove();
    await authClient.signOut();
    router.push('/login');
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#030712',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#030712',
      color: 'white',
      padding: '2rem',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #1f2937',
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          Dashboard
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
            {user.email}
          </span>
          <button
            onClick={handleSignOut}
            style={{
              background: '#1f2937',
              color: 'white',
              border: '1px solid #374151',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div style={{
        background: '#111827',
        border: '1px solid #1f2937',
        borderRadius: '12px',
        padding: '1.5rem',
      }}>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
          Welcome back,
        </p>
        <p style={{ fontSize: '1.25rem', fontWeight: '600', marginTop: '0.25rem' }}>
          {user.name ?? user.email}
        </p>
      </div>
    </div>
  );
}