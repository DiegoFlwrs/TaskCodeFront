'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../hooks/useAuth';
import { useCountdown } from '../../../../hooks/useCountdown';
import { useToastManager } from '../../../../components/ui/toast-manager';
import { EmailVerificationStep } from '../../../../components/auth/EmailVerificationStep';
import { CodeVerificationStep } from '../../../../components/auth/CodeVerificationStep';
import { LoadingOverlay } from '../../../../components/ui/loading';

export default function RegisterWithVerificationPage() {
  const router = useRouter();
  const { toast } = useToastManager();
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { verifyAndRegister, verifyAndRegisterTeamLeader, sendVerificationCode } = useAuth();

  // Timer para la expiración del código
  const { timeLeft, isExpired, start: startTimer, reset: resetTimer } = useCountdown({
    initialTime: 300, // 5 minutos
    onExpire: () => {
      toast.warning(
        'Código expirado',
        'Tu código de verificación ha expirado. Solicita uno nuevo.'
      );
    }
  });

  // Verificar si hay datos de registro al cargar
  useEffect(() => {
    const savedData = sessionStorage.getItem('registrationData');
    if (!savedData) {
      // Si no hay datos, redirigir al registro
      router.push('/register');
      return;
    }
    
    try {
      const data = JSON.parse(savedData);
      setRegistrationData(data);
      startTimer();
    } catch (error) {
      console.error('Error parsing registration data:', error);
      router.push('/register');
    }
  }, [router, startTimer]);

  // Manejar verificación y registro
  const handleVerifyAndRegister = async (code: string) => {
    if (!registrationData) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (registrationData.userType === 'team-leader') {
        await verifyAndRegisterTeamLeader({
          email: registrationData.email,
          verificationCode: code,
          password: registrationData.password,
          nombre: registrationData.nombre,
          equipoNombre: registrationData.equipoNombre || '',
          equipoDescripcion: registrationData.equipoDescripcion
        });
      } else {
        await verifyAndRegister({
          email: registrationData.email,
          verificationCode: code,
          password: registrationData.password,
          nombre: registrationData.nombre
        });
      }
      
      // Limpiar datos del sessionStorage
      sessionStorage.removeItem('registrationData');
      
      toast.success(
        'Cuenta creada',
        '¡Tu cuenta ha sido creada exitosamente! Bienvenido a TaskCodeBack.'
      );
      
      // Redirigir al dashboard
      router.push('/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al verificar el código');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar reenvío de código
  const handleResendCode = async () => {
    if (!registrationData || !isExpired) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      await sendVerificationCode({
        email: registrationData.email,
        nombre: registrationData.nombre
      });
      
      resetTimer();
      startTimer();
      toast.success(
        'Código reenviado',
        'Se ha enviado un nuevo código de verificación a tu email'
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al reenviar el código');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar volver atrás
  const handleBack = () => {
    // Limpiar datos y volver al registro
    sessionStorage.removeItem('registrationData');
    router.push('/register');
  };

  // Mostrar loading si no hay datos aún
  if (!registrationData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingOverlay isLoading={true} text="Verificando datos..." />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">
              TaskCodeBack
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Verificación de Email
            </p>
            <p className="text-sm text-gray-500">
              ✨ Paso 2: Ingresa el código enviado a tu email
            </p>
          </div>

          {/* Indicador de progreso */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-green-500 text-white">
                  ✓
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Datos completados
                </span>
              </div>
              
              <div className="h-1 w-16 rounded bg-green-500" />
              
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-blue-600 text-white">
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Verificar Email
                </span>
              </div>
            </div>
          </div>

          {/* Componente de verificación de código */}
          <CodeVerificationStep
            email={registrationData.email}
            nombre={registrationData.nombre}
            userType={registrationData.userType}
            onSubmit={handleVerifyAndRegister}
            onResend={handleResendCode}
            onBack={handleBack}
            isLoading={isLoading}
            error={error}
            timeLeft={timeLeft}
            canResend={isExpired}
          />

          {/* Footer con enlace a login */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Inicia sesión aquí
              </Link>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              🔒 Todos los registros requieren verificación de email por seguridad
            </p>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      <LoadingOverlay 
        isLoading={isLoading}
        text="Verificando código..."
      />
    </>
  );
}