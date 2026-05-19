'use client';

import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { useToastManager } from '../ui/toast-manager';
import { formatApiError, validateEmail, validatePassword } from '../../lib/utils';
import { authApi } from '../../lib/api';
import { VerificationCodeInput } from './VerificationCodeInput';

const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .min(1, 'El email es requerido')
      .refine(validateEmail, 'Email invalido'),
    verificationCode: z
      .string()
      .regex(/^[A-Z0-9]{6}$/, 'El codigo debe tener 6 caracteres alfanumericos'),
    newPassword: z
      .string()
      .min(6, 'La contrasena debe tener al menos 6 caracteres')
      .refine((password) => validatePassword(password).isValid, {
        message: 'La contrasena debe contener mayusculas, minusculas y numeros',
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contrasenas no coinciden',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToastManager();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialEmail = useMemo(() => {
    return searchParams.get('email') ?? '';
  }, [searchParams]);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: initialEmail,
      verificationCode: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const passwordValidation = validatePassword(form.watch('newPassword') || '');
  const verificationCodeValue = form.watch('verificationCode') || '';

  const handleCodeChange = useCallback((code: string) => {
    const normalized = code.toUpperCase();
    if (normalized === form.getValues('verificationCode')) {
      return;
    }

    form.setValue('verificationCode', normalized, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [form]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsLoading(true);

      const response = await authApi.resetPasswordWithCode({
        email: data.email,
        verificationCode: data.verificationCode,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      toast.success('Contrasena actualizada', response.message);
      setTimeout(() => {
        window.location.href = '/login';
      }, 400);
    } catch (error) {
      toast.error(
        'Error al restablecer contrasena',
        formatApiError(error)
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Restablecer Contrasena
          </CardTitle>
          <CardDescription>
            Ingresa el codigo y tu nueva contrasena
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
              <Label htmlFor="newPassword">Nueva contrasena</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Nueva contrasena"
                {...form.register('newPassword')}
                error={form.formState.errors.newPassword?.message}
                disabled={isLoading}
              />
              {form.watch('newPassword') && (
                <div className="text-xs space-y-1">
                  <div className="flex space-x-2">
                    <div
                      className={`h-1 w-full rounded ${
                        passwordValidation.isValid ? 'bg-green-500' : 'bg-red-200'
                      }`}
                    />
                  </div>
                  {!passwordValidation.isValid && passwordValidation.errors.length > 0 && (
                    <ul className="text-red-500 space-y-0.5">
                      {passwordValidation.errors.map((error, index) => (
                        <li key={index}>- {error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repite tu contrasena"
                {...form.register('confirmPassword')}
                error={form.formState.errors.confirmPassword?.message}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="verificationCode">Codigo de verificacion</Label>
              <div className="flex justify-center">
                <VerificationCodeInput
                  onComplete={handleCodeChange}
                  onChange={handleCodeChange}
                  error={form.formState.isSubmitted && Boolean(form.formState.errors.verificationCode)}
                  disabled={isLoading}
                  className="justify-center"
                />
              </div>
              <input type="hidden" value={verificationCodeValue} {...form.register('verificationCode')} />
              {form.formState.isSubmitted && form.formState.errors.verificationCode?.message && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.verificationCode?.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Actualizando...' : 'Actualizar contrasena'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Volver a iniciar sesion
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
