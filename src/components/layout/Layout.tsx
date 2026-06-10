import type { ReactNode } from 'react';
import { Header } from './Header';
import { OfflineBanner } from '@/components/common/OfflineBanner';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-space-950 text-slate-200">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-mars-950/20 via-space-950 to-space-950 pointer-events-none" />
      <OfflineBanner />
      <Header />
      <main className="relative max-w-6xl mx-auto px-4 py-6 pb-24">{children}</main>
    </div>
  );
}
