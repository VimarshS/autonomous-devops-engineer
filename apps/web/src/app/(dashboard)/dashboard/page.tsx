export default function DashboardPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#030712',
      color: 'white',
      padding: '2rem',
    }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
        Dashboard
      </h1>
      <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>
        You are logged in.
      </p>
    </div>
  );
}