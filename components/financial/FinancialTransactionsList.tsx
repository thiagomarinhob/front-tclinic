'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFinancialTransactions } from '@/hooks/useFinancial';
import { FinancialTransaction, TransactionType } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAGE_SIZE = 10;

interface FinancialTransactionsListProps {
  tenantId: string;
  startDate: string;
  endDate: string;
}

export function FinancialTransactionsList({
  tenantId,
  startDate,
  endDate
}: FinancialTransactionsListProps) {
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'ALL'>('ALL');
  const [page, setPage] = useState(0);

  // Resetar página ao mudar filtros ou período
  useEffect(() => { setPage(0); }, [typeFilter, startDate, endDate]);

  const { data: transactions, isLoading } = useFinancialTransactions(
    tenantId,
    typeFilter !== 'ALL' ? typeFilter : undefined,
    undefined,
    startDate,
    endDate
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDENTE: { label: 'Pendente', variant: 'default' },
      PAGO: { label: 'Pago', variant: 'secondary' },
      CANCELADO: { label: 'Cancelado', variant: 'destructive' },
      FIADO: { label: 'Fiado', variant: 'outline' },
    };
    const config = variants[status] || variants.PENDENTE;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Carregando transações...</p>
        </CardContent>
      </Card>
    );
  }

  const total = transactions?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginated = transactions?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Transações</CardTitle>
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TransactionType | 'ALL')}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              <SelectItem value={TransactionType.INCOME}>Receitas</SelectItem>
              <SelectItem value={TransactionType.EXPENSE}>Despesas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {total > 0 ? (
          <>
            <div className="space-y-2">
              {paginated.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-4 rounded-lg border border-border hover:bg-accent/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{transaction.description}</span>
                      {getStatusBadge(transaction.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {transaction.paymentDate
                        ? `Pago em: ${formatDate(transaction.paymentDate)}`
                        : `Vencimento: ${formatDate(transaction.dueDate)}`
                      }
                      {transaction.categoryName && ` • ${transaction.categoryName}`}
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${
                    transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total} transações
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm px-2">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma transação encontrada para o período selecionado.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
