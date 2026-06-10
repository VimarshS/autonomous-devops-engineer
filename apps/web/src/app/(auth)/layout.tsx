export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#030712',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '2rem',
        background: '#111827',
        borderRadius: '12px',
        border: '1px solid #1f2937',
      }}>
        {children}
      </div>
    </div>
  );
}