'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { authClient, tokenStorage } from '../../../lib/auth-client';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: '/dashboard',
    });

    if (result.error) {
      setError(result.error.message ?? 'Registration failed');
      setLoading(false);
      return;
    }

    if (result.data?.token) {
      tokenStorage.set(result.data.token);
    }

    router.push('/dashboard');
  }

  return (
    <div>
      <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        Create account
      </h1>
      <p style={{ color: '#9ca3af', marginBottom: '2rem', fontSize: '0.875rem' }}>
        Start deploying in minutes
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

      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', color: '#d1d5db', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            minLength={8}
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
            marginBottom: '1.5rem',
          }}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
        Already have an account?{' '}
        <a href="/login" style={{ color: '#2563eb' }}>
          Sign in
        </a>
      </p>
    </div>
  );
}