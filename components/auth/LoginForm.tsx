'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { useAuth } from '../../hooks/useAuth';
import { useToastManager } from '../ui/toast-manager';
import { validateEmail } from '../../lib/utils';

// Schema de validación para el formulario de login
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .refine(validateEmail, 'Email inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { login } = useAuth();
  const { toast } = useToastManager();
  const router = useRouter();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      
      await login(data);
      
      toast.success(
        'Bienvenido',
        'Has iniciado sesión exitosamente'
      );
      setShowForgotPassword(false);
      
      // Redirigir al dashboard
      router.push('/dashboard');
    } catch (error) {
      toast.error(
        'Error de autenticación',
        error instanceof Error ? error.message : 'Credenciales inválidas'
      );
      setShowForgotPassword(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Iniciar Sesión
          </CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder a TaskCode TAD
          </CardDescription>
        </CardHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Tu contraseña"
                {...form.register('password')}
                error={form.formState.errors.password?.message}
                disabled={isLoading}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>

            {showForgotPassword && (
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                Olvidaste tu contrasena?
              </Link>
            )}

            <div className="text-center text-sm text-muted-foreground">
              ¿No tienes una cuenta?{' '}
              <Link 
                href="/register"
                className="font-medium text-primary hover:underline"
              >
                Regístrate aquí
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}