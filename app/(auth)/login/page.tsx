'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '../../../components/auth/LoginForm';
import { useAuth } from '../../../hooks/useAuth';
import { LoadingSpinner } from '../../../components/ui/loading';
import { AuthBrandHeader } from '../../../components/brand/AuthBrandHeader';

export default function LoginPage() {
  const router = useRouter();
  const { state } = useAuth();

  useEffect(() => {
    // Si ya está autenticado, redirigir al dashboard
    if (state.isAuthenticated && !state.isLoading) {
      router.push('/dashboard');
    }
  }, [state.isAuthenticated, state.isLoading, router]);

  // Mostrar loading solo cuando ya esta autenticado
  if (state.isLoading && state.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Si ya está autenticado, no mostrar el formulario
  if (state.isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(var(--tad-green)/0.08)] via-background to-[hsl(var(--tad-black)/0.04)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        <AuthBrandHeader subtitle="Gestión de actividades para desarrolladores" />
        <LoginForm />
      </div>
    </div>
  );
}