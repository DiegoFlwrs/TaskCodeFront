'use client';

import { ForgotPasswordForm } from '../../../components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            TaskCodeBack
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Recupera el acceso a tu cuenta
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
