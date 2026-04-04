'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { ROUTES } from '@/config/constants';
import { useAuthContext } from '@/contexts/AuthContext';

function PlanSelectionSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Aguardar um pouco para o webhook processar
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Recarregar os dados do usuário
        const result = await refreshUser();

        if (result.success) {
          setIsLoading(false);
          // Redirecionar para o dashboard após alguns segundos
          setTimeout(() => {
            router.push(ROUTES.DASHBOARD);
          }, 3000);
        } else {
          setError('Erro ao verificar pagamento. Você será redirecionado em breve.');
          setTimeout(() => {
            router.push(ROUTES.DASHBOARD);
          }, 5000);
        }
      } catch (err) {
        setError('Erro ao verificar pagamento. Você será redirecionado em breve.');
        setTimeout(() => {
          router.push(ROUTES.DASHBOARD);
        }, 5000);
      }
    };

    if (sessionId) {
      verifyPayment();
    } else {
      setError('Sessão de pagamento não encontrada.');
      setTimeout(() => {
        router.push(ROUTES.PLAN_SELECTION);
      }, 3000);
    }
  }, [sessionId, refreshUser, router]);

  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Card>
        <CardHeader className="text-center">
          {isLoading ? (
            <>
              <Loader2 className="h-16 w-16 mx-auto mb-4 text-primary animate-spin" />
              <CardTitle className="text-2xl">Processando pagamento...</CardTitle>
              <CardDescription>
                Aguarde enquanto verificamos o status do seu pagamento
              </CardDescription>
            </>
          ) : error ? (
            <>
              <CardTitle className="text-2xl text-yellow-600">Atenção</CardTitle>
              <CardDescription>{error}</CardDescription>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
              <CardTitle className="text-2xl text-green-600">Pagamento aprovado!</CardTitle>
              <CardDescription>
                Seu plano foi ativado com sucesso. Você será redirecionado para o dashboard em
                breve.
              </CardDescription>
            </>
          )}
        </CardHeader>
        {!isLoading && !error && (
          <CardContent className="text-center">
            <Button onClick={() => router.push(ROUTES.DASHBOARD)} className="mt-4">
              Ir para o Dashboard
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function PlanSelectionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="text-center">
            <Loader2 className="h-16 w-16 mx-auto mb-4 text-primary animate-spin" />
            <CardTitle className="text-2xl">Carregando...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <PlanSelectionSuccessContent />
    </Suspense>
  );
}
