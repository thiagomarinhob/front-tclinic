'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, FlaskConical, CheckCircle, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { LabDashboard } from '@/types';

interface LabDashboardStatsProps {
  dashboard: LabDashboard;
}

export function LabDashboardStats({ dashboard }: LabDashboardStatsProps) {
  const cards = [
    {
      title: 'Solicitações',
      value: dashboard.totalRequested,
      icon: ClipboardList,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Em Coleta / Recebimento',
      value: dashboard.totalCollected,
      icon: FlaskConical,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      title: 'Em Análise',
      value: dashboard.totalInAnalysis,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'Concluídos',
      value: dashboard.totalCompleted,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Resultados Pendentes',
      value: dashboard.pendingResults,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      title: 'Aguardando Validação',
      value: dashboard.awaitingValidation,
      icon: ShieldCheck,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`${card.bg} p-2 rounded-lg`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
