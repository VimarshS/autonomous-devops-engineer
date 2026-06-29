'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/auth-context';
import { Sidebar } from '../../../../components/layout/sidebar';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  repositoryUrl: string | null;
  repositoryOwner: string | null;
  repositoryName: string | null;
  deployedUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  DRAFT: '#475569',
  ANALYZING: '#2563eb',
  ANALYZED: '#7c3aed',
  GENERATING: '#d97706',
  GENERATED: '#059669',
  DEPLOYING: '#2563eb',
  LIVE: '#16a34a',
  FAILED: '#dc2626',
  PAUSED: '#475569',
};

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchProject();
    }
  }, [user, params.id]);

  async function fetchProject() {
    try {
      const res = await fetch(`/api/projects/${params.id}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        router.push('/dashboard');
        return;
      }
      const data = await res.json();
      setProject(data);
    } catch {
      router.push('/dashboard');
    } finally {
      setProjectLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this project? This cannot be undone.')) return;

    await fetch(`/api/projects/${params.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    router.push('/dashboard');
  }

  if (loading || projectLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        Loading...
      </div>
    );
  }

  if (!project) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#020617' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '1rem', padding: 0 }}
          >
            Back to projects
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700' }}>
                {project.name}
              </h1>
              {project.description && (
                <p style={{ color: '#64748b', marginTop: '0.25rem' }}>
                  {project.description}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{
                background: statusColors[project.status] ?? '#475569',
                color: 'white',
                fontSize: '0.75rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontWeight: '500',
              }}>
                {project.status}
              </span>
              <button
                onClick={handleDelete}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'transparent',
                  color: '#dc2626',
                  border: '1px solid #dc2626',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Info cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>

          {/* Repository */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.25rem' }}>
            <p style={{ color: '#475569', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Repository</p>
            {project.repositoryUrl ? (
              <a href={project.repositoryUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: '0.875rem', wordBreak: 'break-all' }}>
                {project.repositoryOwner}/{project.repositoryName}
              </a>
            ) : (
              <p style={{ color: '#334155', fontSize: '0.875rem' }}>No repository connected</p>
            )}
          </div>

          {/* Deployed URL */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.25rem' }}>
            <p style={{ color: '#475569', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deployed URL</p>
            {project.deployedUrl ? (
              <a href={project.deployedUrl} target="_blank" rel="noreferrer" style={{ color: '#16a34a', fontSize: '0.875rem' }}>
                {project.deployedUrl}
              </a>
            ) : (
              <p style={{ color: '#334155', fontSize: '0.875rem' }}>Not deployed yet</p>
            )}
          </div>

          {/* Created */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.25rem' }}>
            <p style={{ color: '#475569', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created</p>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Pipeline placeholder */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.5rem' }}>
          <h2 style={{ color: 'white', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
            Pipeline
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {['Analysis', 'Docker', 'Terraform', 'CI/CD', 'Deploy'].map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  background: i === 0 && project.status !== 'DRAFT' ? '#1e3a5f' : '#1e293b',
                  color: i === 0 && project.status !== 'DRAFT' ? '#60a5fa' : '#475569',
                  border: `1px solid ${i === 0 && project.status !== 'DRAFT' ? '#2563eb' : '#334155'}`,
                }}>
                  {step}
                </div>
                {i < 4 && <span style={{ color: '#334155' }}>›</span>}
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}