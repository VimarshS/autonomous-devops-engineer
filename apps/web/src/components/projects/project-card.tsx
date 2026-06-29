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
          <span style={{ background: statusColors[project.status] ?? '#475569', color: 'white', fontSize: '0.6875rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', fontWeight: '500' }}>
            {project.status}
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