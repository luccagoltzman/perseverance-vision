import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/context/ThemeContext';
import { Layout } from '@/components/layout/Layout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { GalleryPage } from '@/features/rovers/GalleryPage';
import { MarsBootSequence } from '@/components/immersive/MarsBootSequence';
import { PageTransition } from '@/components/immersive/PageTransition';
import { useServiceWorker } from '@/hooks/usePWAStatus';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

function SWUpdateBanner() {
  const { needRefresh, updateServiceWorker } = useServiceWorker();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 z-50 max-w-md mx-auto bg-surface-elevated/95 backdrop-blur border border-border rounded-xl p-4 flex items-center justify-between gap-3 shadow-xl dark:bg-space-800/95 dark:border-space-600">
      <p className="text-sm text-content-muted dark:text-slate-300">Nova versão disponível</p>
      <button
        type="button"
        onClick={() => updateServiceWorker(true)}
        className="px-4 py-1.5 bg-mars-600 hover:bg-mars-500 text-white text-sm rounded-lg"
      >
        Atualizar
      </button>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <BrowserRouter>
        <MarsBootSequence />
        <Layout>
          <Routes>
            <Route
              path="/"
              element={
                <PageTransition>
                  <DashboardPage />
                </PageTransition>
              }
            />
            <Route
              path="/gallery"
              element={
                <PageTransition>
                  <GalleryPage />
                </PageTransition>
              }
            />
          </Routes>
        </Layout>
        <SWUpdateBanner />
      </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
