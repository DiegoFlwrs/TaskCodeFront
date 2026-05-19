'use client';

import { ResetPasswordForm } from '../../../../components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            TaskCodeBack
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Restablece tu contrasena
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
