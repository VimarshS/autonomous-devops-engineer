'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '../../../contexts/auth-context';
import { Sidebar } from '../../../components/layout/sidebar';
import { ProjectCard } from '../../../components/projects/project-card';
import { CreateProjectModal } from '../../../components/projects/create-project-modal';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  repositoryUrl: string | null;
  repositoryOwner: string | null;
  repositoryName: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  async function fetchProjects() {
    try {
      const res = await fetch('/api/projects', { credentials: 'include' });
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch {
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }

  async function handleCreateProject(dto: {
    name: string;
    description?: string;
    repositoryUrl?: string;
  }) {
    const res = await fetch('/api/projects', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });

    if (!res.ok) throw new Error('Failed to create project');

    await fetchProjects();
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#020617',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
      }}>
        Loading...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#020617' }}>
      <Sidebar />

      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}>
          <div>
            <h2 style={{
              color: 'white',
              fontSize: '1.25rem',
              fontWeight: '600',
            }}>
              Projects
            </h2>
            <p style={{ color: '#475569', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '0.625rem 1rem',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            + New project
          </button>
        </div>

        {/* Projects grid */}
        {projectsLoading ? (
          <p style={{ color: '#475569' }}>Loading projects...</p>
        ) : projects.length === 0 ? (
          <div style={{
            border: '1px dashed #1e293b',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center',
          }}>
            <p style={{ color: '#475569', marginBottom: '1rem' }}>
              No projects yet
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '0.625rem 1rem',
                background: '#1e293b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
          }}>
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateProject}
        />
      )}
    </div>
  );
}