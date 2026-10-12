import type { Metadata } from 'next';

import { Providers } from '../components/providers';
import './globals.css';
import { Toaster } from 'sonner';

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
      <body>
        <Providers>
          {children}
        </Providers>
        <Toaster position="bottom-right" theme="dark" richColors />
      </body>
    </html>
  );
}