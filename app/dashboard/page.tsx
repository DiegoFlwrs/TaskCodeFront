'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/layout/Header';
import { DashboardContent } from '../../components/dashboard/DashboardContent';
import { LoadingSpinner } from '../../components/ui/loading';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../hooks/useAuth';

export default function DashboardPage() {
  const { state, checkAuthStatus } = useAuth();
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

  if (!state.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            No se pudo cargar tu perfil. Reintenta.
          </p>
          <Button onClick={checkAuthStatus}>
            Reintentar
          </Button>
        </div>
      </div>
    );
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