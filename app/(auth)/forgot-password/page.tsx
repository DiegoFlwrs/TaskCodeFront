'use client';

import { ForgotPasswordForm } from '../../../components/auth/ForgotPasswordForm';
import { AuthBrandHeader } from '../../../components/brand/AuthBrandHeader';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(var(--tad-green)/0.08)] via-background to-[hsl(var(--tad-black)/0.04)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        <AuthBrandHeader subtitle="Recupera el acceso a tu cuenta" />
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
