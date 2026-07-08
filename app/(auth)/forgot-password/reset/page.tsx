'use client';

import { Suspense } from 'react';
import { ResetPasswordForm } from '../../../../components/auth/ResetPasswordForm';
import { AuthBrandHeader } from '../../../../components/brand/AuthBrandHeader';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(var(--tad-green)/0.08)] via-background to-[hsl(var(--tad-black)/0.04)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        <AuthBrandHeader subtitle="Restablece tu contraseña" />
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
