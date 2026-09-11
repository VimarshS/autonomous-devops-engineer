'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/auth-context';
import { Sidebar } from '../../../../components/layout/sidebar';
import { RepoPickerModal } from '../../../../components/projects/repo-picker-modal';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  repositoryUrl: string | null;
  repositoryOwner: string | null;
  repositoryName: string | null;
  defaultBranch: string | null;
  deployedUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Analysis {
  primaryLanguage: string;
  framework: string;
  packageManager: string;
  databases: string[];
  hasDockerfile: boolean;
  hasDockerCompose: boolean;
  hasCiCdConfig: boolean;
  status: string;
  completedAt: string | null;
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

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [showRepoPicker, setShowRepoPicker] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [artifacts, setArtifacts] = useState<
  Array<{
    id: string;
    type: string;
    filename: string;
    content: string;
    version: number;
  }>
>([]);

const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchProject();
      fetchAnalysis();
      fetchArtifacts();
    }
  }, [user, params.id]);

  async function fetchProject() {
    try {
      const res = await fetch(`/api/projects/${params.id}`, { credentials: 'include' });
      if (!res.ok) { router.push('/dashboard'); return; }
      setProject(await res.json());
    } catch {
      router.push('/dashboard');
    } finally {
      setProjectLoading(false);
    }
  }

  async function fetchAnalysis() {
    try {
      const res = await fetch(`/api/analysis/${params.id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data) setAnalysis(data);
      }
    } catch {
      // Analysis not available yet
    }
  }

  async function fetchArtifacts() {
  try {
    const res = await fetch(`/api/artifacts/${params.id}`, {
      credentials: 'include',
    });

    if (res.ok) {
      setArtifacts(await res.json());
    }
  } catch {
    // Ignore
  }
}

  async function handleTriggerAnalysis() {
    if (!project?.repositoryUrl) return;
    setAnalyzing(true);
    try {
      await fetch('/api/analysis/trigger', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: params.id }),
      });
      // Poll for results
      const interval = setInterval(async () => {
        await fetchProject();
        await fetchAnalysis();
        const res = await fetch(`/api/projects/${params.id}`, { credentials: 'include' });
        const p = await res.json() as Project;
        if (p.status === 'ANALYZED' || p.status === 'FAILED') {
          clearInterval(interval);
          setAnalyzing(false);
        }
      }, 3000);
    } catch {
      setAnalyzing(false);
    }
  }

  async function handleConnectRepo(repo: { fullName: string; url: string; defaultBranch: string }) {
    const [owner, name] = repo.fullName.split('/');
    await fetch(`/api/projects/${params.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repositoryUrl: repo.url, repositoryOwner: owner, repositoryName: name, defaultBranch: repo.defaultBranch }),
    });
    await fetchProject();
  }

  async function handleDelete() {
    if (!confirm('Delete this project?')) return;
    await fetch(`/api/projects/${params.id}`, { method: 'DELETE', credentials: 'include' });
    router.push('/dashboard');
  }

  if (loading || projectLoading) {
    return <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Loading...</div>;
  }

  if (!project) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#020617' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>

        <div style={{ marginBottom: '2rem' }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '1rem', padding: 0 }}>
            Back to projects
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700' }}>{project.name}</h1>
              {project.description && <p style={{ color: '#64748b', marginTop: '0.25rem' }}>{project.description}</p>}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ background: statusColors[project.status] ?? '#475569', color: 'white', fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontWeight: '500' }}>
                {project.status}
              </span>
              {project.repositoryUrl && project.status === 'DRAFT' && (
                <button onClick={handleTriggerAnalysis} disabled={analyzing} style={{ padding: '0.5rem 1rem', background: analyzing ? '#334155' : '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', cursor: analyzing ? 'not-allowed' : 'pointer' }}>
                  {analyzing ? 'Analyzing...' : 'Analyze'}
                </button>
              )}
              {project.repositoryUrl && project.status === 'ANALYZED' && (
                <button onClick={handleTriggerAnalysis} disabled={analyzing} style={{ padding: '0.5rem 1rem', background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
                  Re-analyze
                </button>
              )}
              <button onClick={handleDelete} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#dc2626', border: '1px solid #dc2626', borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
                Delete
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.25rem' }}>
            <p style={{ color: '#475569', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Repository</p>
            {project.repositoryUrl ? (
              <a href={project.repositoryUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: '0.875rem', wordBreak: 'break-all' }}>
                {project.repositoryOwner}/{project.repositoryName}
              </a>
            ) : (
              <button onClick={() => setShowRepoPicker(true)} style={{ background: '#1e3a5f', color: '#60a5fa', border: '1px solid #2563eb', borderRadius: '6px', padding: '0.375rem 0.75rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
                Connect repository
              </button>
            )}
          </div>

          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.25rem' }}>
            <p style={{ color: '#475569', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deployed URL</p>
            {project.deployedUrl ? (
              <a href={project.deployedUrl} target="_blank" rel="noreferrer" style={{ color: '#16a34a', fontSize: '0.875rem' }}>{project.deployedUrl}</a>
            ) : (
              <p style={{ color: '#334155', fontSize: '0.875rem' }}>Not deployed yet</p>
            )}
          </div>

          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.25rem' }}>
            <p style={{ color: '#475569', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created</p>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{new Date(project.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {analysis && (
  <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
    <h2 style={{ color: 'white', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Analysis Results</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
      {/* ... existing result cards ... */}
    </div>

    {/* ADD THIS BUTTON HERE */}
    {project.status === 'ANALYZED' || project.status === 'GENERATED' ? (
  <div
    style={{
      marginTop: '1.5rem',
      paddingTop: '1rem',
      borderTop: '1px solid #1e293b',
      display: 'flex',
      gap: '0.75rem',
      flexWrap: 'wrap',
    }}
  >
    {/* Docker */}
    <button
      onClick={async () => {
        try {
          const res = await fetch(`/api/docker/${params.id}/generate`, {
            method: 'POST',
            credentials: 'include',
          });

          const data = await res.json();

          if (!res.ok) {
            console.error('Docker generation failed:', data);
            alert('Docker generation failed');
            return;
          }

          console.log('Docker generated:', data);
          await fetchProject();
        } catch (error) {
          console.error('Docker generation error:', error);
          alert('Docker generation failed');
        }
      }}
      style={{
        padding: '0.625rem 1rem',
        background: '#059669',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '0.875rem',
        cursor: 'pointer',
      }}
    >
      Generate Dockerfile
    </button>

    {/* Terraform */}
    <button
      onClick={async () => {
        try {
          const res = await fetch(`/api/terraform/${params.id}/generate`, {
            method: 'POST',
            credentials: 'include',
          });

          const data = await res.json();

          if (!res.ok) {
            console.error('Terraform generation failed:', data);
            alert('Terraform generation failed');
            return;
          }

          console.log('Terraform generated:', data);
          await fetchProject();
        } catch (error) {
          console.error('Terraform generation error:', error);
          alert('Terraform generation failed');
        }
      }}
      style={{
        padding: '0.625rem 1rem',
        background: '#7c3aed',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '0.875rem',
        cursor: 'pointer',
      }}
    >
      Generate Terraform
    </button>

    {/* CI/CD */}
    <button
      onClick={async () => {
        try {
          const res = await fetch(`/api/cicd/${params.id}/generate`, {
            method: 'POST',
            credentials: 'include',
          });

          const data = await res.json();

          if (!res.ok) {
            console.error('CI/CD generation failed:', data);
            alert('CI/CD generation failed');
            return;
          }

          console.log('CI/CD generated:', data);
          await fetchProject();
        } catch (error) {
          console.error('CI/CD generation error:', error);
          alert('CI/CD generation failed');
        }
      }}
      style={{
        padding: '0.625rem 1rem',
        background: '#d97706',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '0.875rem',
        cursor: 'pointer',
      }}
    >
      Generate CI/CD
    </button>
  </div>
) : null}
  </div>
)}

        {analyzing && (
          <div style={{ background: '#0f172a', border: '1px solid #2563eb', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
            <p style={{ color: '#60a5fa', fontSize: '0.875rem' }}>
              Analyzing repository... This may take a moment.
            </p>
          </div>
        )}

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.5rem' }}>
          <h2 style={{ color: 'white', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Pipeline</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {['Analysis', 'Docker', 'Terraform', 'CI/CD', 'Deploy'].map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8125rem', background: i === 0 && project.status !== 'DRAFT' ? '#1e3a5f' : '#1e293b', color: i === 0 && project.status !== 'DRAFT' ? '#60a5fa' : '#475569', border: `1px solid ${i === 0 && project.status !== 'DRAFT' ? '#2563eb' : '#334155'}` }}>
                  {step}
                </div>
                {i < 4 && <span style={{ color: '#334155' }}>{'>'}</span>}
              </div>
            ))}
          </div>
        </div>
        {artifacts.length > 0 && (
  <div
    style={{
      background: '#0f172a',
      border: '1px solid #1e293b',
      borderRadius: '12px',
      padding: '1.5rem',
      marginTop: '1.5rem',
    }}
  >
    <h2
      style={{
        color: 'white',
        fontSize: '1rem',
        fontWeight: '600',
        marginBottom: '1rem',
      }}
    >
      Generated Files
    </h2>

    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        marginBottom: '1rem',
      }}
    >
      {artifacts.map((a) => (
        <button
          key={a.id}
          onClick={() =>
            setSelectedArtifact(
              selectedArtifact === a.id ? null : a.id
            )
          }
          style={{
            padding: '0.375rem 0.75rem',
            background:
              selectedArtifact === a.id
                ? '#1e3a5f'
                : '#1e293b',
            color:
              selectedArtifact === a.id
                ? '#60a5fa'
                : '#94a3b8',
            border: `1px solid ${
              selectedArtifact === a.id
                ? '#2563eb'
                : '#334155'
            }`,
            borderRadius: '6px',
            fontSize: '0.75rem',
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
        >
          {a.filename}
        </button>
      ))}
    </div>

    {selectedArtifact &&
      (() => {
        const artifact = artifacts.find(
          (a) => a.id === selectedArtifact
        );

        return artifact ? (
          <pre
            style={{
              background: '#020617',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '1rem',
              color: '#e2e8f0',
              fontSize: '0.75rem',
              overflow: 'auto',
              maxHeight: '400px',
              margin: 0,
            }}
          >
            {artifact.content}
          </pre>
        ) : null;
      })()}
  </div>
)}

      </main>

      {showRepoPicker && (
        <RepoPickerModal onClose={() => setShowRepoPicker(false)} onSelect={handleConnectRepo} />
      )}
    </div>
  );
}
