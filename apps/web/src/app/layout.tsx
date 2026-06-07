import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Autonomous DevOps Engineer',
  description: 'AI-powered infrastructure generation platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}