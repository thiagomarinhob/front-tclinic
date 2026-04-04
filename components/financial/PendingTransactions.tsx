'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { FinancialTransaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PendingTransactionsProps {
  transactions: FinancialTransaction[];
}

export function PendingTransactions({ transactions }: PendingTransactionsProps) {
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.dueDate).getTime();
    const dateB = new Date(b.dueDate).getTime();
    return dateA - dateB;
  });

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

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Transações Pendentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedTransactions.map((transaction) => {
            const overdue = isOverdue(transaction.dueDate);
            return (
              <div
                key={transaction.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  overdue ? 'border-red-200 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{transaction.description}</span>
                    {getStatusBadge(transaction.status)}
                    {overdue && (
                      <Badge variant="destructive" className="text-xs">
                        Vencida
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Vencimento: {formatDate(transaction.dueDate)}
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
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
