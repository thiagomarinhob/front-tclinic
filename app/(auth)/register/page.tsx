import { SignUpForm } from '@/components/auth/SignUpForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cadastro - TClinic',
  description: 'Cadastre sua clínica ou consultório no TClinic',
};

export default function RegisterPage() {
  // Sobrescreve o layout do (auth) para ter mais espaço
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 overflow-y-auto">
      <div className="w-full max-w-5xl my-auto">
        <SignUpForm />
      </div>
    </div>
  );
}
