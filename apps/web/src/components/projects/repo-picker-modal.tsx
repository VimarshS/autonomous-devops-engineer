'use client';

import { useEffect, useState } from 'react';

interface Repo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  language: string | null;
  updatedAt: string;
  url: string;
  defaultBranch: string;
}
interface RepoPicker {
  onClose: () => void;
  onSelect: (repo: Repo) => Promise<void>;
}

export function RepoPickerModal({ onClose, onSelect }: RepoPicker) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selecting, setSelecting] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/github/repos', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setRepos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load repositories');
        setLoading(false);
      });
  }, []);

  const filtered = repos.filter(r =>
    r.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (r.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  async function handleSelect(repo: Repo) {
    setSelecting(repo.id);
    try {
      await onSelect(repo);
      onClose();
    } catch {
      setError('Failed to connect repository');
      setSelecting(null);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', width: '100%', maxWidth: '560px', margin: '0 1rem', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1e293b' }}>
          <h2 style={{ color: 'white', fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            Connect Repository
          </h2>
          <input
            type="text"
            placeholder="Search repositories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '0.875rem', boxSizing: 'border-box' }}
            autoFocus
          />
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{ padding: '1rem 1.5rem', color: '#fca5a5', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#475569' }}>
              Loading repositories...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#475569' }}>
              No repositories found
            </div>
          ) : (
            filtered.map(repo => (
              <div
                key={repo.id}
                onClick={() => handleSelect(repo)}
                style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #1e293b', cursor: selecting ? 'not-allowed' : 'pointer', opacity: selecting && selecting !== repo.id ? 0.5 : 1 }}
                onMouseEnter={e => { if (!selecting) (e.currentTarget as HTMLDivElement).style.background = '#1e293b'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ color: 'white', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                      {repo.fullName}
                      {repo.private && (
                        <span style={{ marginLeft: '0.5rem', background: '#334155', color: '#94a3b8', fontSize: '0.6875rem', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          private
                        </span>
                      )}
                    </p>
                    {repo.description && (
                      <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>
                        {repo.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, marginLeft: '1rem' }}>
                    {repo.language && (
                      <span style={{ color: '#475569', fontSize: '0.75rem' }}>
                        {repo.language}
                      </span>
                    )}
                    {selecting === repo.id && (
                      <span style={{ color: '#2563eb', fontSize: '0.75rem' }}>
                        Connecting...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#64748b', border: '1px solid #334155', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}