'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/layout/Header';
import { DashboardContent } from '../../components/dashboard/DashboardContent';
import { LoadingSpinner } from '../../components/ui/loading';
import { useAuth } from '../../hooks/useAuth';

export default function DashboardPage() {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si no está autenticado y no está cargando, redirigir al login
    if (!state.isAuthenticated && !state.isLoading) {
      router.push('/login');
    }
  }, [state.isAuthenticated, state.isLoading, router]);

  // Mostrar loading mientras se verifica el estado de autenticación
  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Si no está autenticado, no mostrar el dashboard
  if (!state.isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <DashboardContent />
      </main>
    </div>
  );
}