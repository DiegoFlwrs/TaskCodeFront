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
import { useToastManager } from '../ui/toast-manager';
import { formatApiError, validateEmail } from '../../lib/utils';
import { authApi } from '../../lib/api';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .refine(validateEmail, 'Email invalido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToastManager();
  const router = useRouter();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);

      const response = await authApi.sendForgotPasswordCode({
        email: data.email,
      });

      toast.success('Codigo enviado', response.message);
      router.push(`/forgot-password/reset?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      toast.error(
        'Error al enviar codigo',
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
            Recuperar Contrasena
          </CardTitle>
          <CardDescription>
            Enviaremos un codigo de verificacion a tu email
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
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Enviando codigo...' : 'Enviar codigo'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Ya recordaste tu contrasena?{' '}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Inicia sesion
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
