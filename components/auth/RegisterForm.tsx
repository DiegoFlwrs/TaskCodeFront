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
import { validateEmail, validatePassword } from '../../lib/utils';
import { Users, User } from 'lucide-react';

// Schema de validación para el formulario de registro
const registerSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  email: z
    .string()
    .min(1, 'El email es requerido')
    .refine(validateEmail, 'Email inválido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .refine((password) => validatePassword(password).isValid, {
      message: 'La contraseña debe contener mayúsculas, minúsculas y números',
    }),
  confirmPassword: z.string(),
  equipoNombre: z.string().optional(),
  equipoDescripcion: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

type UserType = 'individual' | 'team-leader';

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<UserType>('individual');
  const { sendVerificationCode } = useAuth();
  const { toast } = useToastManager();
  const router = useRouter();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: '',
      email: '',
      password: '',
      confirmPassword: '',
      equipoNombre: '',
      equipoDescripcion: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      
      // Enviar código de verificación en lugar de registrar directamente
      await sendVerificationCode({
        email: data.email,
        nombre: data.nombre
      });

      // Guardar datos del formulario en sessionStorage para usarlos después
      const registrationData = {
        nombre: data.nombre,
        email: data.email,
        password: data.password,
        userType,
        equipoNombre: data.equipoNombre,
        equipoDescripcion: data.equipoDescripcion
      };
      sessionStorage.setItem('registrationData', JSON.stringify(registrationData));
      
      toast.success(
        'Código enviado',
        `Hemos enviado un código de verificación a ${data.email}`
      );
      
      // Redirigir a la página de verificación
      router.push('/register/verify');
    } catch (error) {
      toast.error(
        'Error al enviar código',
        error instanceof Error ? error.message : 'No se pudo enviar el código de verificación'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const passwordValidation = validatePassword(form.watch('password') || '');

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Crear Cuenta
          </CardTitle>
          <CardDescription>
            Únete a TaskCode TAD y gestiona tus proyectos
          </CardDescription>
        </CardHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
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
                      ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground shadow-md'
                      : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                  }`}
                  onClick={() => setUserType('individual')}
                  disabled={isLoading}
                >
                  <User className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Individual</div>
                    <div className={`text-xs ${
                      userType === 'individual' ? 'text-primary-foreground/80' : 'text-muted-foreground'
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
                      ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground shadow-md'
                      : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                  }`}
                  onClick={() => setUserType('team-leader')}
                  disabled={isLoading}
                >
                  <Users className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Team Leader</div>
                    <div className={`text-xs ${
                      userType === 'team-leader' ? 'text-primary-foreground/80' : 'text-muted-foreground'
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
              
              {/* Indicador de fortaleza de contraseña */}
              {form.watch('password') && (
                <div className="text-xs space-y-1">
                  <div className="flex space-x-2">
                    <div
                      className={`h-1 w-full rounded ${
                        passwordValidation.isValid ? 'bg-primary' : 'bg-red-200'
                      }`}
                    />
                  </div>
                  {!passwordValidation.isValid && passwordValidation.errors.length > 0 && (
                    <ul className="text-red-500 space-y-0.5">
                      {passwordValidation.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirma tu contraseña"
                {...form.register('confirmPassword')}
                error={form.formState.errors.confirmPassword?.message}
                disabled={isLoading}
              />
            </div>

            {/* Campos adicionales para Team Leader */}
            {userType === 'team-leader' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="equipoNombre">Nombre del equipo *</Label>
                  <Input
                    id="equipoNombre"
                    placeholder="Mi Equipo de Desarrollo"
                    {...form.register('equipoNombre')}
                    error={form.formState.errors.equipoNombre?.message}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="equipoDescripcion">Descripción del equipo</Label>
                  <Input
                    id="equipoDescripcion"
                    placeholder="Descripción opcional del equipo"
                    {...form.register('equipoDescripcion')}
                    error={form.formState.errors.equipoDescripcion?.message}
                    disabled={isLoading}
                  />
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading || !passwordValidation.isValid}
            >
              {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{' '}
              <Link 
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Inicia sesión aquí
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}