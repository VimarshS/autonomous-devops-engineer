'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { authClient, tokenStorage } from '../../../lib/auth-client';
import { useAuth } from '../../../contexts/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { refetch } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: '/dashboard',
      });

      if (result.error) {
        const errorMsg = result.error.message ?? 'Login failed';
        setError(errorMsg);
        setLoading(false);
        return;
      }

      if (result.data?.token) {
        tokenStorage.set(result.data.token);
      }

      // Refetch session to update auth context
      await refetch();
      
      router.push('/dashboard');
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  }

  async function handleGitHubLogin() {
  await authClient.signIn.social({
    provider: 'github',
    callbackURL: `${window.location.origin}/dashboard`,
  });
}

  return (
    <div>
      <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        Welcome back
      </h1>
      <p style={{ color: '#9ca3af', marginBottom: '2rem', fontSize: '0.875rem' }}>
        Sign in to your account
      </p>

      {error && (
        <div style={{
          background: '#450a0a',
          border: '1px solid #dc2626',
          borderRadius: '8px',
          padding: '0.75rem',
          color: '#fca5a5',
          fontSize: '0.875rem',
          marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleEmailLogin}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', color: '#d1d5db', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.625rem 0.75rem',
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.875rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', color: '#d1d5db', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.625rem 0.75rem',
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.875rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.625rem',
            background: loading ? '#374151' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '1rem',
          }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
        or
      </div>

      <button
        onClick={handleGitHubLogin}
        style={{
          width: '100%',
          padding: '0.625rem',
          background: '#1f2937',
          color: 'white',
          border: '1px solid #374151',
          borderRadius: '8px',
          fontSize: '0.875rem',
          fontWeight: '500',
          cursor: 'pointer',
          marginBottom: '1.5rem',
        }}
      >
        Continue with GitHub
      </button>

      <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
        Don't have an account?{' '}
        <a href="/register" style={{ color: '#2563eb' }}>
          Sign up
        </a>
      </p>
    </div>
  );
}