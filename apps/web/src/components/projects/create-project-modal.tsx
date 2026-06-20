'use client';

import { useState } from 'react';

interface CreateProjectModalProps {
  onClose: () => void;
  onCreate: (project: { name: string; description?: string; repositoryUrl?: string }) => Promise<void>;
}

export function CreateProjectModal({ onClose, onCreate }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onCreate({
        name,
        description: description || undefined,
        repositoryUrl: repositoryUrl || undefined,
      });
      onClose();
    } catch (err) {
      setError('Failed to create project');
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
    }}
    onClick={onClose}
    >
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '480px',
          margin: '0 1rem',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{
          color: 'white',
          fontSize: '1.125rem',
          fontWeight: '600',
          marginBottom: '1.5rem',
        }}>
          Create Project
        </h2>

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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: '#94a3b8',
              fontSize: '0.8125rem',
              marginBottom: '0.375rem',
            }}>
              Project name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="my-awesome-app"
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: '#94a3b8',
              fontSize: '0.8125rem',
              marginBottom: '0.375rem',
            }}>
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description"
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: '#94a3b8',
              fontSize: '0.8125rem',
              marginBottom: '0.375rem',
            }}>
              GitHub Repository URL
            </label>
            <input
              type="url"
              value={repositoryUrl}
              onChange={e => setRepositoryUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.625rem 1rem',
                background: 'transparent',
                color: '#64748b',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.625rem 1rem',
                background: loading ? '#334155' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Creating...' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}