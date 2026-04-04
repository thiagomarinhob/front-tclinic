import { SetPasswordForm } from '@/components/auth/SetPasswordForm';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Definir Senha - TClinic',
  description: 'Defina sua senha de acesso',
};

interface SetPasswordPageProps {
  searchParams: {
    token?: string;
  };
}

export default function SetPasswordPage({ searchParams }: SetPasswordPageProps) {
  const token = searchParams.token;

  if (!token) {
    redirect('/login');
  }

  return <SetPasswordForm token={token} />;
}