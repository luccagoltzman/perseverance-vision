import type { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { ScanlineOverlay } from '@/components/immersive/ScanlineOverlay';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-surface text-content overflow-x-hidden transition-colors duration-300">
      <div className="stars-bg fixed inset-0 pointer-events-none" aria-hidden />
      <div className="fixed inset-0 bg-gradient-to-b from-mars-50/80 via-surface to-surface pointer-events-none dark:from-mars-950/30 dark:via-space-950 dark:to-space-950" aria-hidden />
      <ScanlineOverlay />
      <OfflineBanner />
      <Header />
      <main className="relative max-w-6xl mx-auto px-4 py-5 pb-28 md:pb-10">{children}</main>
      <BottomNav />
    </div>
  );
}
