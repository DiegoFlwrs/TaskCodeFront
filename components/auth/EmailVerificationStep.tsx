'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { validateEmail } from '../../lib/utils';
import { Users, User, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Schema de validación
const emailStepSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  email: z
    .string()
    .min(1, 'El email es requerido')
    .refine(validateEmail, 'Email inválido'),
});

type EmailStepFormData = z.infer<typeof emailStepSchema>;

interface EmailVerificationStepProps {
  userType: 'individual' | 'team-leader';
  onUserTypeChange: (type: 'individual' | 'team-leader') => void;
  onSubmit: (data: EmailStepFormData) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function EmailVerificationStep({
  userType,
  onUserTypeChange,
  onSubmit,
  isLoading = false,
  error
}: EmailVerificationStepProps) {
  const form = useForm<EmailStepFormData>({
    resolver: zodResolver(emailStepSchema),
    defaultValues: {
      nombre: '',
      email: '',
    },
  });

  const handleSubmit = (data: EmailStepFormData) => {
    onSubmit(data);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Verificar Email
          </CardTitle>
          <CardDescription>
            Te enviaremos un código de verificación a tu email
          </CardDescription>
        </CardHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            {/* Selector de tipo de usuario */}
            <div className="space-y-3">
              <Label>Tipo de cuenta</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className={`h-auto p-4 flex flex-col items-center space-y-2 transition-all duration-200 ${
                    userType === 'individual' 
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white shadow-lg' 
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => onUserTypeChange('individual')}
                  disabled={isLoading}
                >
                  <User className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Individual</div>
                    <div className={`text-xs ${
                      userType === 'individual' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      Trabajo solo
                    </div>
                  </div>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className={`h-auto p-4 flex flex-col items-center space-y-2 transition-all duration-200 ${
                    userType === 'team-leader' 
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white shadow-lg' 
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => onUserTypeChange('team-leader')}
                  disabled={isLoading}
                >
                  <Users className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Team Leader</div>
                    <div className={`text-xs ${
                      userType === 'team-leader' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      Lidero un equipo
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Campos del formulario */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre completo</Label>
              <Input
                id="nombre"
                placeholder="Juan Pérez"
                {...form.register('nombre')}
                error={form.formState.errors.nombre?.message}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                {...form.register('email')}
                error={form.formState.errors.email?.message}
                disabled={isLoading}
              />
            </div>

            {/* Error general */}
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
          </CardContent>

          <CardContent className="pt-0">
            <div className="space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando código...
                  </div>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Código de Verificación
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center">
                <Link 
                  href="/login"
                  className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Volver al login
                </Link>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{' '}
                <Link 
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Inicia sesión aquí
                </Link>
              </div>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}