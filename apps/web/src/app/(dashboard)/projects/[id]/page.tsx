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
}

interface Artifact {
  id: string;
  type: string;
  filename: string;
  content: string;
  version: number;
}

interface SecurityScan {
  score: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  findings: Array<{
    title: string;
    severity: string;
    description: string;
    recommendation: string;
    file: string | null;
  }>;
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
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [securityScan, setSecurityScan] = useState<SecurityScan | null>(null);

  const [projectLoading, setProjectLoading] = useState(true);
  const [showRepoPicker, setShowRepoPicker] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(
    null,
  );
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Analysis WebSocket progress
  const [analysisProgress, setAnalysisProgress] = useState<{
    progress: number;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchProject();
      fetchAnalysis();
      fetchArtifacts();
      fetchSecurityScan();
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

      setProject(await res.json());
    } catch {
      router.push('/dashboard');
    } finally {
      setProjectLoading(false);
    }
  }

  async function fetchAnalysis() {
    try {
      const res = await fetch(`/api/analysis/${params.id}`, {
        credentials: 'include',
      });

      if (res.ok) {
        const d = await res.json();

        if (d) {
          setAnalysis(d);
        }
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
        const d = await res.json();

        if (Array.isArray(d)) {
          setArtifacts(d);
        }
      }
    } catch {
      // Artifacts not available yet
    }
  }

  async function fetchSecurityScan() {
    try {
      const res = await fetch(`/api/security/${params.id}`, {
        credentials: 'include',
      });

      if (res.ok) {
        const d = await res.json();

        if (d) {
          setSecurityScan(d);
        }
      }
    } catch {
      // Security scan not available yet
    }
  }

  // --------------------------------------------------
  // Trigger analysis + WebSocket progress
  // --------------------------------------------------

  async function handleTriggerAnalysis() {
    if (!project?.repositoryUrl) {
      return;
    }

    setAnalyzing(true);

    setAnalysisProgress({
      progress: 0,
      message: 'Starting...',
    });

    try {
      const res = await fetch('/api/analysis/trigger', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: params.id,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to trigger analysis');
      }

      const { jobId } = (await res.json()) as {
        jobId: string;
      };

      console.log('Analysis job started:', jobId);

      // Connect WebSocket
      const { io } = await import('socket.io-client');

      const socket = io('http://localhost:3001/events', {
        withCredentials: true,
      });

      socket.on('connect', () => {
        console.log('WebSocket connected:', socket.id);

        socket.emit('join-project', params.id);
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });

      // Receive analysis progress
      socket.on(
        'job:progress',
        (data: {
          jobId: string;
          projectId: string;
          progress: number;
          message: string;
        }) => {
          console.log('Analysis progress:', data);

          // Ignore progress events from another job
          if (data.jobId !== jobId) {
            return;
          }

          setAnalysisProgress({
            progress: data.progress,
            message: data.message,
          });
        },
      );

      // Analysis completed
      socket.on(
        'job:completed',
        async (data: {
          jobId: string;
          projectId: string;
        }) => {
          console.log('Analysis completed:', data);

          // Ignore another job's completion event
          if (data.jobId !== jobId) {
            return;
          }

          socket.disconnect();

          setAnalyzing(false);

          setAnalysisProgress(null);

          await fetchProject();
          await fetchAnalysis();
        },
      );

      // Analysis failed
      socket.on(
        'job:failed',
        (data: {
          jobId: string;
          projectId: string;
          error: string;
        }) => {
          console.error('Analysis failed:', data.error);

          // Ignore another job's failure event
          if (data.jobId !== jobId) {
            return;
          }

          socket.disconnect();

          setAnalyzing(false);

          setAnalysisProgress(null);

          fetchProject();
        },
      );
    } catch (error) {
      console.error('Failed to start analysis:', error);

      setAnalyzing(false);

      setAnalysisProgress(null);
    }
  }

  async function handleConnectRepo(repo: {
    fullName: string;
    url: string;
    defaultBranch: string;
  }) {
    const [owner, name] = repo.fullName.split('/');

    await fetch(`/api/projects/${params.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        repositoryUrl: repo.url,
        repositoryOwner: owner,
        repositoryName: name,
        defaultBranch: repo.defaultBranch,
      }),
    });

    await fetchProject();
  }

  async function handleDelete() {
    if (!confirm('Delete this project?')) {
      return;
    }

    await fetch(`/api/projects/${params.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    router.push('/dashboard');
  }

  async function handleGenerate(type: string) {
    const endpoints: Record<string, string> = {
      docker: `/api/docker/${params.id}/generate`,
      terraform: `/api/terraform/${params.id}/generate`,
      cicd: `/api/cicd/${params.id}/generate`,
    };

    await fetch(endpoints[type] ?? '', {
      method: 'POST',
      credentials: 'include',
    });

    await fetchArtifacts();
    await fetchProject();
  }

  async function handleSecurityScan() {
    await fetch(`/api/security/${params.id}/scan`, {
      method: 'POST',
      credentials: 'include',
    });

    await fetchSecurityScan();
  }
async function handleAskAi() {
  if (!aiQuestion.trim()) return;
  setAiLoading(true);
  setAiResponse(null);
  try {
    const res = await fetch(`/api/ai/${params.id}/ask`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: aiQuestion }),
    });
    const data = await res.json() as { response: string };
    setAiResponse(data.response);
  } catch {
    setAiResponse('Failed to get AI response');
  } finally {
    setAiLoading(false);
  }
}
  if (loading || projectLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#020617',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        Loading...
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const canGenerate =
    project.status === 'ANALYZED' ||
    project.status === 'GENERATED';

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#020617',
      }}
    >
      <Sidebar />

      <main
        style={{
          flex: 1,
          padding: '2rem',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              color: '#475569',
              cursor: 'pointer',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              padding: 0,
            }}
          >
            Back to projects
          </button>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h1
                style={{
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                }}
              >
                {project.name}
              </h1>

              {project.description && (
                <p
                  style={{
                    color: '#64748b',
                    marginTop: '0.25rem',
                  }}
                >
                  {project.description}
                </p>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  background:
                    statusColors[project.status] ?? '#475569',
                  color: 'white',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontWeight: '500',
                }}
              >
                {project.status}
              </span>

              {project.repositoryUrl && (
                <button
                  onClick={handleTriggerAnalysis}
                  disabled={analyzing}
                  style={{
                    padding: '0.5rem 1rem',
                    background: analyzing
                      ? '#334155'
                      : '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    cursor: analyzing
                      ? 'not-allowed'
                      : 'pointer',
                  }}
                >
                  {analyzing
                    ? 'Analyzing...'
                    : project.status === 'DRAFT'
                      ? 'Analyze'
                      : 'Re-analyze'}
                </button>
              )}

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

        {/* Project information */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '1.25rem',
            }}
          >
            <p
              style={{
                color: '#475569',
                fontSize: '0.75rem',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Repository
            </p>

            {project.repositoryUrl ? (
              <a
                href={project.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#2563eb',
                  fontSize: '0.875rem',
                  wordBreak: 'break-all',
                }}
              >
                {project.repositoryOwner}/
                {project.repositoryName}
              </a>
            ) : (
              <button
                onClick={() => setShowRepoPicker(true)}
                style={{
                  background: '#1e3a5f',
                  color: '#60a5fa',
                  border: '1px solid #2563eb',
                  borderRadius: '6px',
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                Connect repository
              </button>
            )}
          </div>

          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '1.25rem',
            }}
          >
            <p
              style={{
                color: '#475569',
                fontSize: '0.75rem',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Deployed URL
            </p>

            {project.deployedUrl ? (
              <a
                href={project.deployedUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#16a34a',
                  fontSize: '0.875rem',
                }}
              >
                {project.deployedUrl}
              </a>
            ) : (
              <p
                style={{
                  color: '#334155',
                  fontSize: '0.875rem',
                }}
              >
                Not deployed yet
              </p>
            )}
          </div>

          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '1.25rem',
            }}
          >
            <p
              style={{
                color: '#475569',
                fontSize: '0.75rem',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Created
            </p>

            <p
              style={{
                color: '#94a3b8',
                fontSize: '0.875rem',
              }}
            >
              {new Date(
                project.createdAt,
              ).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Analysis progress */}
        {analyzing && (
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #2563eb',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
              }}
            >
              <p
                style={{
                  color: '#60a5fa',
                  fontSize: '0.875rem',
                }}
              >
                {analysisProgress?.message ??
                  'Starting analysis...'}
              </p>

              <p
                style={{
                  color: '#60a5fa',
                  fontSize: '0.875rem',
                }}
              >
                {analysisProgress?.progress ?? 0}%
              </p>
            </div>

            <div
              style={{
                background: '#1e293b',
                borderRadius: '9999px',
                height: '4px',
              }}
            >
              <div
                style={{
                  background: '#2563eb',
                  borderRadius: '9999px',
                  height: '4px',
                  width: `${analysisProgress?.progress ?? 0}%`,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}

        {/* Analysis results */}
        {analysis && (
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
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
              Analysis Results
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              {[
                {
                  label: 'Language',
                  value: analysis.primaryLanguage,
                },
                {
                  label: 'Framework',
                  value: analysis.framework,
                },
                {
                  label: 'Package Manager',
                  value: analysis.packageManager,
                },
                {
                  label: 'Dockerfile',
                  value: analysis.hasDockerfile
                    ? 'Yes'
                    : 'No',
                },
                {
                  label: 'Docker Compose',
                  value: analysis.hasDockerCompose
                    ? 'Yes'
                    : 'No',
                },
                {
                  label: 'CI/CD Config',
                  value: analysis.hasCiCdConfig
                    ? 'Yes'
                    : 'No',
                },
              ].map((item) => (
                <div key={item.label}>
                  <p
                    style={{
                      color: '#475569',
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {item.label}
                  </p>

                  <p
                    style={{
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {canGenerate && (
              <div
                style={{
                  borderTop: '1px solid #1e293b',
                  paddingTop: '1rem',
                }}
              >
                <p
                  style={{
                    color: '#475569',
                    fontSize: '0.75rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  GENERATE
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    onClick={() =>
                      handleGenerate('docker')
                    }
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    Dockerfile
                  </button>

                  <button
                    onClick={() =>
                      handleGenerate('terraform')
                    }
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#7c3aed',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    Terraform
                  </button>

                  <button
                    onClick={() =>
                      handleGenerate('cicd')
                    }
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#d97706',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    CI/CD
                  </button>

                  <button
                    onClick={handleSecurityScan}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    Security Scan
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pipeline */}
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
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
            Pipeline
          </h2>

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {[
              'Analysis',
              'Docker',
              'Terraform',
              'CI/CD',
              'Deploy',
            ].map((step, i) => (
              <div
                key={step}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    background:
                      i === 0 &&
                      project.status !== 'DRAFT'
                        ? '#1e3a5f'
                        : '#1e293b',
                    color:
                      i === 0 &&
                      project.status !== 'DRAFT'
                        ? '#60a5fa'
                        : '#475569',
                    border: `1px solid ${
                      i === 0 &&
                      project.status !== 'DRAFT'
                        ? '#2563eb'
                        : '#334155'
                    }`,
                  }}
                >
                  {step}
                </div>

                {i < 4 && (
                  <span style={{ color: '#334155' }}>
                    {'>'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Generated artifacts */}
        {artifacts.length > 0 && (
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
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
                      selectedArtifact === a.id
                        ? null
                        : a.id,
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
                  (a) => a.id === selectedArtifact,
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

        {/* Security scan */}
        {securityScan && (
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <h2
                style={{
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                }}
              >
                Security Scan
              </h2>

              <span
                style={{
                  background:
                    securityScan.score >= 80
                      ? '#14532d'
                      : securityScan.score >= 60
                        ? '#713f12'
                        : '#450a0a',
                  color:
                    securityScan.score >= 80
                      ? '#4ade80'
                      : securityScan.score >= 60
                        ? '#fbbf24'
                        : '#f87171',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                }}
              >
                Score: {securityScan.score}/100
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1rem',
                flexWrap: 'wrap',
              }}
            >
              {securityScan.criticalCount > 0 && (
                <span
                  style={{
                    color: '#f87171',
                    fontSize: '0.875rem',
                  }}
                >
                  {securityScan.criticalCount} Critical
                </span>
              )}

              {securityScan.highCount > 0 && (
                <span
                  style={{
                    color: '#fb923c',
                    fontSize: '0.875rem',
                  }}
                >
                  {securityScan.highCount} High
                </span>
              )}

              {securityScan.mediumCount > 0 && (
                <span
                  style={{
                    color: '#fbbf24',
                    fontSize: '0.875rem',
                  }}
                >
                  {securityScan.mediumCount} Medium
                </span>
              )}

              {securityScan.lowCount > 0 && (
                <span
                  style={{
                    color: '#94a3b8',
                    fontSize: '0.875rem',
                  }}
                >
                  {securityScan.lowCount} Low
                </span>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              {securityScan.findings.map((f, i) => (
                <div
                  key={i}
                  style={{
                    background: '#020617',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    padding: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <span
                      style={{
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                      }}
                    >
                      {f.title}
                    </span>

                    <span
                      style={{
                        fontSize: '0.75rem',
                        color:
                          f.severity === 'CRITICAL'
                            ? '#f87171'
                            : f.severity === 'HIGH'
                              ? '#fb923c'
                              : f.severity === 'MEDIUM'
                                ? '#fbbf24'
                                : '#94a3b8',
                      }}
                    >
                      {f.severity}
                    </span>
                  </div>

                  <p
                    style={{
                      color: '#64748b',
                      fontSize: '0.8125rem',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {f.description}
                  </p>

                  <p
                    style={{
                      color: '#475569',
                      fontSize: '0.75rem',
                    }}
                  >
                    Fix: {f.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {analysis && (
  <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
    <h2 style={{ color: 'white', fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Ask AI</h2>
    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
      <input
        type="text"
        value={aiQuestion}
        onChange={e => setAiQuestion(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAskAi()}
        placeholder="Ask about your project, deployment issues, security fixes..."
        style={{ flex: 1, padding: '0.625rem 0.75rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '0.875rem' }}
      />
      <button
        onClick={handleAskAi}
        disabled={aiLoading || !aiQuestion.trim()}
        style={{ padding: '0.625rem 1rem', background: aiLoading ? '#334155' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', cursor: aiLoading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
      >
        {aiLoading ? 'Thinking...' : 'Ask Claude'}
      </button>
    </div>
    {aiResponse && (
      <div style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
        <pre style={{ color: '#e2e8f0', fontSize: '0.8125rem', whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit', lineHeight: '1.6' }}>
          {aiResponse}
        </pre>
      </div>
    )}
    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {['How do I fix the security findings?', 'Explain the generated Dockerfile', 'What AWS resources will be created?', 'How do I deploy this to production?'].map(q => (
        <button key={q} onClick={() => setAiQuestion(q)} style={{ padding: '0.25rem 0.625rem', background: '#1e293b', color: '#64748b', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
          {q}
        </button>
      ))}
    </div>
  </div>
)}
      </main>

      {showRepoPicker && (
        <RepoPickerModal
          onClose={() => setShowRepoPicker(false)}
          onSelect={handleConnectRepo}
        />
      )}
    </div>
  );
}