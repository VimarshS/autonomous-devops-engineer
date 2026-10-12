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

const statusConfig: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  DRAFT: { bg: '#1e293b', color: '#64748b', label: 'Draft' },
  ANALYZING: { bg: '#1e3a5f', color: '#60a5fa', label: 'Analyzing' },
  ANALYZED: { bg: '#2e1065', color: '#a78bfa', label: 'Analyzed' },
  GENERATING: { bg: '#1c1917', color: '#f59e0b', label: 'Generating' },
  GENERATED: { bg: '#052e16', color: '#4ade80', label: 'Generated' },
  FAILED: { bg: '#450a0a', color: '#f87171', label: 'Failed' },
  LIVE: { bg: '#052e16', color: '#4ade80', label: 'Live' },
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <a href={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
      <div
        style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.25rem', cursor: 'pointer' }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#334155'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#1e293b'; }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <h3 style={{ color: 'white', fontSize: '0.9375rem', fontWeight: '600' }}>
            {project.name}
          </h3>
          <span style={{ background: statusConfig[project.status]?.bg ?? '#475569', color: statusConfig[project.status]?.color ?? 'white', fontSize: '0.6875rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', fontWeight: '500' }}>
            {statusConfig[project.status]?.label ?? project.status}
          </span>
        </div>
        {project.description && (
          <p style={{ color: '#64748b', fontSize: '0.8125rem', marginBottom: '0.75rem', lineHeight: '1.5' }}>
            {project.description}
          </p>
        )}
        {project.repositoryName && (
          <p style={{ color: '#475569', fontSize: '0.75rem', fontFamily: 'monospace' }}>
            {project.repositoryOwner}/{project.repositoryName}
          </p>
        )}
      </div>
    </a>
  );
}