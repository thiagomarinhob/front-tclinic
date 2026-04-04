'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { ROUTES } from '@/config/constants';
import { toast } from 'sonner';
import type { PlanType } from '@/types';
import { cn } from '@/lib/utils';
import { createCheckoutSessionAction, startTrialAction } from '@/actions/auth-actions';
import { useAuthContext } from '@/contexts/AuthContext';

const plans = [
  {
    id: 'TRIAL' as 'TRIAL',
    name: 'Teste Grátis',
    description: 'Experimente todas as funcionalidades por 14 dias sem compromisso',
    price: 'Grátis',
    period: 'por 14 dias',
    features: [
      'Acesso completo a todas as funcionalidades',
      'Até 50 pacientes',
      'Agendamento online',
      'Prontuário eletrônico',
      'Suporte por email',
      'Sem necessidade de cartão de crédito',
      'Cancele a qualquer momento',
    ],
    isTrial: true,
  },
  {
    id: 'BASIC' as PlanType,
    name: 'Básico',
    description: 'Ideal para clínicas pequenas que estão começando',
    price: 'R$ 299',
    period: '/mês',
    features: [
      'Até 50 pacientes',
      'Agendamento online',
      'Prontuário eletrônico',
      'Suporte por email',
      'Relatórios básicos',
    ],
  },
  {
    id: 'PRO' as PlanType,
    name: 'Profissional',
    description: 'Para clínicas em crescimento que precisam de mais recursos',
    price: 'R$ 599',
    period: '/mês',
    features: [
      'Até 200 pacientes',
      'Agendamento online',
      'Prontuário eletrônico completo',
      'Suporte prioritário',
      'Relatórios avançados',
      'Integração com laboratórios',
      'App móvel',
    ],
    popular: true,
  },
  {
    id: 'CUSTOM' as PlanType,
    name: 'Personalizado',
    description: 'Solução sob medida para grandes clínicas e redes',
    price: 'Sob consulta',
    period: '',
    features: [
      'Pacientes ilimitados',
      'Todas as funcionalidades PRO',
      'Suporte dedicado 24/7',
      'Relatórios personalizados',
      'Integrações customizadas',
      'Treinamento da equipe',
      'Consultoria especializada',
    ],
  },
];

export function PlanSelectionPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuthContext();
  const [selectedPlan, setSelectedPlan] = useState<PlanType | 'TRIAL' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartTrial = async () => {
    try {
      setIsLoading(true);
      setSelectedPlan('TRIAL');

      // Verificar se o usuário tem clinicId (tenantId)
      if (!user?.clinicId) {
        toast.error('ID da clínica não encontrado. Faça login novamente.');
        router.push(ROUTES.LOGIN);
        return;
      }

      // Iniciar trial
      const result = await startTrialAction(user.clinicId);

      if (result.success) {
        toast.success('Período de teste iniciado com sucesso! Aproveite os 14 dias gratuitos.');
        // Atualizar dados do usuário
        await refreshUser();
        // Redirecionar para o dashboard
        router.push(ROUTES.DASHBOARD);
      } else {
        toast.error(result.error || 'Erro ao iniciar período de teste. Tente novamente.');
        setSelectedPlan(null);
      }
    } catch {
      toast.error('Erro ao iniciar período de teste. Tente novamente.');
      setSelectedPlan(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = async (planId: PlanType) => {
    try {
      setIsLoading(true);
      setSelectedPlan(planId);

      // Verificar se o usuário tem clinicId (tenantId)
      if (!user?.clinicId) {
        toast.error('ID da clínica não encontrado. Faça login novamente.');
        router.push(ROUTES.LOGIN);
        return;
      }

      // Se for CUSTOM, apenas mostrar mensagem (não atualiza o plano)
      if (planId === 'CUSTOM') {
        toast.info('Entre em contato com nossa equipe de vendas para conhecer o plano personalizado.');
        return;
      }

      // Criar sessão de checkout do Stripe
      const result = await createCheckoutSessionAction(user.clinicId, planId);

      if (result.success && result.data?.checkoutUrl) {
        // Redirecionar para o checkout do Stripe
        window.location.href = result.data.checkoutUrl;
      } else {
        toast.error(result.error || 'Erro ao criar sessão de pagamento. Tente novamente.');
        setSelectedPlan(null);
      }
    } catch {
      toast.error('Erro ao selecionar plano. Tente novamente.');
      setSelectedPlan(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8 lg:mb-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 lg:mb-4">
          Escolha o Plano Ideal
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
          Selecione o plano que melhor se adapta às necessidades da sua clínica
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              'relative flex flex-col transition-all hover:shadow-xl hover:scale-105',
              'h-full',
              plan.popular && 'border-primary border-2 shadow-lg lg:scale-105',
              plan.isTrial && 'border-green-500 border-2 shadow-lg',
              selectedPlan === plan.id && 'ring-2 ring-primary ring-offset-2'
            )}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="bg-primary text-primary-foreground text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 rounded-full shadow-md">
                  Mais Popular
                </span>
              </div>
            )}
            {plan.isTrial && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="bg-green-500 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 rounded-full shadow-md">
                  Recomendado
                </span>
              </div>
            )}

            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl lg:text-2xl">{plan.name}</CardTitle>
              <CardDescription className="text-xs sm:text-sm lg:text-base mt-2">
                {plan.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col flex-1 pt-0">
              <div className="mb-4 sm:mb-6 lg:mb-8">
                <div className="flex items-baseline gap-1 sm:gap-2">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground text-xs sm:text-sm lg:text-base">
                      {plan.period}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-2 sm:space-y-3 lg:space-y-4 mb-6 lg:mb-8 flex-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 sm:gap-3">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 mt-0.5 lg:mt-1" />
                    <span className="text-xs sm:text-sm lg:text-base leading-relaxed">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => {
                  if (plan.isTrial) {
                    handleStartTrial();
                  } else {
                    handleSelectPlan(plan.id as PlanType);
                  }
                }}
                disabled={isLoading}
                variant={plan.popular || plan.isTrial ? 'default' : 'outline'}
                size="lg"
                className={cn(
                  'w-full mt-auto text-sm sm:text-base lg:text-lg py-2 sm:py-3',
                  plan.isTrial && 'bg-green-500 hover:bg-green-600 text-white'
                )}
              >
                {isLoading && selectedPlan === plan.id
                  ? 'Processando...'
                  : plan.isTrial
                  ? 'Começar Teste Grátis'
                  : plan.id === 'CUSTOM'
                  ? 'Falar com Vendas'
                  : 'Selecionar Plano'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 sm:mt-8 lg:mt-12 text-center space-y-2">
        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
          Experimente gratuitamente por 14 dias ou escolha um plano pago com garantia de 30 dias ou seu dinheiro de volta.
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Não é necessário cartão de crédito para começar o teste grátis.
        </p>
      </div>
    </div>
  );
}
