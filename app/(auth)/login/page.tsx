import { LoginForm } from '@/components/auth/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - TClinic',
  description: 'Faça login no TClinic',
};

export default function LoginPage() {
  return <LoginForm />;
}