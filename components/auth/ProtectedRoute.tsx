'use client'

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { ROUTES } from '@/config/constants';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
      return;
    }

    // Validar status do tenant e redirecionar se necessário
    if (user) {
      const tenantStatus = user.tenantStatus;

      // Se está na página de seleção de plano
      if (pathname === ROUTES.PLAN_SELECTION) {
        // Se já tem plano ativo ou está em trial, redireciona para dashboard
        if (tenantStatus === 'ACTIVE' || tenantStatus === 'TRIAL') {
          router.push(ROUTES.DASHBOARD);
          return;
        } else if (tenantStatus === 'CANCELED') {
          // Conta cancelada, não pode acessar
          router.push(ROUTES.LOGIN);
          return;
        }
        // Se PENDING_SETUP, SUSPENDED ou undefined, permanece na página de seleção
        return;
      }

      // Para outras rotas protegidas do dashboard, validar status
      // Se PENDING_SETUP ou SUSPENDED, força redirecionamento para seleção de plano
      if (tenantStatus === 'PENDING_SETUP' || tenantStatus === 'SUSPENDED' || !tenantStatus) {
        router.push(ROUTES.PLAN_SELECTION);
        return;
      } else if (tenantStatus === 'CANCELED') {
        // Conta cancelada, não pode acessar o dashboard
        router.push(ROUTES.LOGIN);
        return;
      }
      // Se ACTIVE ou TRIAL, permite acesso ao dashboard
    }
  }, [isAuthenticated, isLoading, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}