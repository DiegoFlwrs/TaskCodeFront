'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RegisterForm } from '../../../components/auth/RegisterForm';
import { useAuth } from '../../../hooks/useAuth';
import { LoadingSpinner } from '../../../components/ui/loading';

export default function RegisterPage() {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            TaskCodeBack
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Únete y gestiona tus actividades de desarrollo
          </p>
          <p className="mt-1 text-sm text-gray-500">
            ✨ Registro seguro con verificación por email
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}