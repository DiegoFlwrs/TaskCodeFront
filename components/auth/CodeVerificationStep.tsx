'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { VerificationCodeInput } from './VerificationCodeInput';
import { CountdownTimer } from './CountdownTimer';
import { ArrowLeft, RefreshCw, Shield, CheckCircle } from 'lucide-react';

interface CodeVerificationStepProps {
  email: string;
  nombre: string;
  userType: 'individual' | 'team-leader';
  onSubmit: (code: string) => void; // Solo necesita el código
  onResend: () => void;
  onBack: () => void;
  isLoading?: boolean;
  error?: string | null;
  timeLeft: number;
  canResend: boolean;
  showSuccessAnimation?: boolean;
}

export function CodeVerificationStep({
  email,
  nombre,
  userType,
  onSubmit,
  onResend,
  onBack,
  isLoading = false,
  error,
  timeLeft,
  canResend,
  showSuccessAnimation = false
}: CodeVerificationStepProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCodeComplete, setIsCodeComplete] = useState(false);

  // Limpiar error del código cuando se cambie
  useEffect(() => {
    if (codeError) {
      setCodeError(false);
    }
  }, [verificationCode]);

  // Mostrar error del código cuando hay error
  useEffect(() => {
    if (error && error.toLowerCase().includes('código')) {
      setCodeError(true);
    }
  }, [error]);

  const handleCodeComplete = (code: string) => {
    console.log('Código completado:', code); // Debug
    setVerificationCode(code);
    setIsCodeComplete(code.length === 6);
  };

  // Función para manejar cambios en el código (incluso parciales)
  const handleCodeChange = (code: string) => {
    console.log('Código cambiado:', code); // Debug
    setVerificationCode(code);
    setIsCodeComplete(code.length === 6);
    // Si el código cambió y había un error, limpiarlo
    if (codeError && code.length > 0) {
      setCodeError(false);
    }
  };

  const handleSubmit = async () => {
    console.log('Intentando enviar código:', verificationCode); // Debug
    if (!verificationCode || verificationCode.length !== 6) {
      setCodeError(true);
      return;
    }

    setIsValidating(true);
    setCodeError(false);
    
    try {
      // Simular validación del código
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mostrar animación de éxito
      setShowSuccess(true);
      
      // Esperar un momento para mostrar el éxito y luego proceder
      setTimeout(() => {
        onSubmit(verificationCode);
      }, 2000);
      
    } catch (error) {
      setCodeError(true);
    } finally {
      setIsValidating(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setVerificationCode('');
    setCodeError(false);
    await onResend();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Verificar Código
          </CardTitle>
          <CardDescription>
            Hemos enviado un código de 6 dígitos a:
            <br />
            <strong className="text-foreground">{email}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Información del usuario */}
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>{nombre}</strong> - {userType === 'team-leader' ? 'Team Leader' : 'Individual'}
            </p>
          </div>

          {/* Input del código */}
          <div className="space-y-3">
            <Label className="text-center block">Código de verificación</Label>
            <VerificationCodeInput
              onComplete={handleCodeComplete}
              onChange={handleCodeChange}
              error={codeError}
              disabled={isLoading || isValidating}
              className="justify-center"
            />
            {/* Debug info - remover en producción */}
            <p className="text-xs text-gray-400 text-center">
              Código actual: "{verificationCode}" (longitud: {verificationCode.length})
            </p>
          </div>

          {/* Timer y botón de reenvío */}
          <div className="text-center space-y-2">
            <CountdownTimer
              initialTime={timeLeft}
              onExpire={() => {}} // Manejado por el hook principal
              autoStart={true}
              className="justify-center"
            />
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={!canResend || isLoading}
              className="text-blue-600 hover:text-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reenviar código
            </Button>
          </div>

          {/* Animación de éxito */}
          {showSuccess && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 animate-bounce">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-600 mb-2">
                ¡Código Validado Correctamente!
              </h3>
              <p className="text-sm text-gray-600">
                Creando tu cuenta...
              </p>
            </div>
          )}

          {/* Error general */}
          {error && !showSuccess && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* Botones */}
          {!showSuccess && (
            <>
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={isLoading || isValidating}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
                
                <Button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1"
                  disabled={
                    isLoading || 
                    isValidating ||
                    !isCodeComplete
                  }
                >
                  {isValidating ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Validando...
                    </div>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Validar Código
                    </>
                  )}
                </Button>
              </div>
              
              {/* Debug info - remover en producción */}
              <p className="text-xs text-gray-400 text-center">
                Botón deshabilitado: {(isLoading || isValidating || !isCodeComplete).toString()}
                | isCodeComplete: {isCodeComplete.toString()} | Código: "{verificationCode}"
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}