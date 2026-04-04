'use client';

import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp } from 'lucide-react';
import { useFinancialTransactions, useFinancialDashboard } from '@/hooks/useFinancial';
import { useAuthContext } from '@/contexts/AuthContext';
import { PaymentMethod } from '@/types';
import type { FinancialTransaction } from '@/types';
import type { Transaction } from '@/data/mockFinancialData';
import { SummaryCards } from '@/components/financial/SummaryCards';
import { FinancialCharts } from '@/components/financial/FinancialCharts';
import { TransactionList } from '@/components/financial/TransactionList';
import { FinancialTransactionDialog } from '@/components/financial/FinancialTransactionDialog';

type GlobalPeriod =
  | '7'
  | '30'
  | '90'
  | '180'
  | '365'
  | 'all';

const PERIOD_OPTIONS: { value: GlobalPeriod; label: string }[] = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: '180', label: 'Últimos 6 meses' },
  { value: '365', label: 'Último ano' },
  { value: 'all', label: 'Todo período' },
];

function getDateRange(period: GlobalPeriod): { startDate: string | undefined; endDate: string | undefined } {
  const end = new Date();
  const endDate = end.toISOString().split('T')[0];
  if (period === 'all') return { startDate: undefined, endDate: undefined };
  const start = new Date();
  start.setDate(start.getDate() - Number(period));
  const startDate = start.toISOString().split('T')[0];
  return { startDate, endDate };
}

function paymentMethodLabel(method?: PaymentMethod): string {
  if (!method) return '—';
  const labels: Record<PaymentMethod, string> = {
    [PaymentMethod.PIX]: 'PIX',
    [PaymentMethod.BOLETO]: 'Boleto',
    [PaymentMethod.DEBITO]: 'Cartão Débito',
    [PaymentMethod.CREDITO]: 'Cartão Crédito',
    [PaymentMethod.DINHEIRO]: 'Dinheiro',
    [PaymentMethod.OUTRO]: 'Transferência',
  };
  return labels[method] ?? method;
}

function mapApiTransactionToTransaction(t: FinancialTransaction): Transaction {
  const date = (t.paymentDate || t.dueDate || t.createdAt).split('T')[0];
  return {
    id: t.id,
    date,
    description: t.description,
    type: t.type === 'INCOME' ? 'receita' : 'despesa',
    category: t.categoryName ?? 'Outros',
    amount: Math.abs(t.amount),
    patient: undefined,
    paymentMethod: paymentMethodLabel(t.paymentMethod),
  };
}

export default function FinancialPage() {
  const { user } = useAuthContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [globalPeriod, setGlobalPeriod] = useState<GlobalPeriod>('all');

  const { startDate, endDate } = useMemo(() => getDateRange(globalPeriod), [globalPeriod]);

  // Lista de transações: backend aceita type, status, startDate, endDate (todos opcionais)
  const { data: apiTransactions = [], isLoading: loadingTx, isError: errorTx, refetch } = useFinancialTransactions(
    user?.clinicId ?? null,
    undefined,
    undefined,
    startDate,
    endDate
  );

  // Dashboard: totais consideram apenas status PAGO e paymentDate no período (igual backend)
  const { data: dashboard, isLoading: loadingDashboard, isError: errorDashboard } = useFinancialDashboard(
    user?.clinicId ?? null,
    startDate,
    endDate
  );

  const isLoading = loadingTx || loadingDashboard;
  const isError = errorTx || errorDashboard;

  const transactions: Transaction[] = useMemo(
    () => apiTransactions.map(mapApiTransactionToTransaction),
    [apiTransactions]
  );

  return (
    <div className="space-y-6">
      {/* Header conforme prints */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Painel Financeiro</h2>
          </div>
          <p className="text-muted-foreground mt-1">
            Clínica Geral – Acompanhamento de movimentações
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={globalPeriod} onValueChange={(v) => setGlobalPeriod(v as GlobalPeriod)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nova Transação
          </Button>
        </div>
      </div>

      <FinancialTransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => refetch()}
      />

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando dados financeiros...</p>
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-destructive font-medium">Erro ao carregar os dados financeiros.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          <SummaryCards
            transactions={transactions}
            totalReceita={dashboard != null && startDate != null && endDate != null ? Number(dashboard.totalIncome) : undefined}
            totalDespesa={dashboard != null && startDate != null && endDate != null ? Number(dashboard.totalExpense) : undefined}
          />
          <FinancialCharts transactions={transactions} />
          <TransactionList transactions={transactions} />
        </>
      )}
    </div>
  );
}
