export default function HomePage() {
  return (
    <main style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#030712',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Autonomous DevOps Engineer
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '1.25rem', marginBottom: '2rem' }}>
          Upload a repository. Get production infrastructure.
        </p>
        <span style={{ 
          background: '#2563eb', 
          padding: '0.5rem 1.5rem', 
          borderRadius: '9999px',
          fontSize: '0.875rem'
        }}>
          Coming Soon
        </span>
      </div>
    </main>
  );
}