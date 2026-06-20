'use client';

import { useAuth } from '../../contexts/auth-context';
import { authClient, tokenStorage } from '../../lib/auth-client';

export function Sidebar() {
  const { user } = useAuth();

  async function handleSignOut() {
    tokenStorage.remove();
    await authClient.signOut();
    window.location.href = '/login';
  }

  return (
    <aside style={{ width: '240px', minHeight: '100vh', background: '#0f172a', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', padding: '1.5rem 0', flexShrink: 0 }}>
      <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
        <h1 style={{ color: 'white', fontSize: '1rem', fontWeight: '700' }}>ADE</h1>
        <p style={{ color: '#475569', fontSize: '0.7rem' }}>Autonomous DevOps</p>
      </div>

      <nav style={{ flex: 1, padding: '0 0.75rem' }}>
        <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '6px', color: 'white', background: '#1e293b', fontSize: '0.875rem', textDecoration: 'none' }}>
          Projects
        </a>
      </nav>

      <div style={{ padding: '1rem 1.5rem 0', borderTop: '1px solid #1e293b' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.email}
        </p>
        <button onClick={handleSignOut} style={{ width: '100%', padding: '0.5rem', background: 'transparent', color: '#64748b', border: '1px solid #1e293b', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}