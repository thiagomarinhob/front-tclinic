'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpCircle, ArrowDownCircle, DollarSign, TrendingUp } from 'lucide-react';
import { FinancialDashboardResponse } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface FinancialStatsProps {
  dashboard: FinancialDashboardResponse;
}

export function FinancialStats({ dashboard }: FinancialStatsProps) {
  const balanceColor = dashboard.balance >= 0 ? 'text-green-600' : 'text-red-600';
  const balanceBgColor = dashboard.balance >= 0 ? 'bg-green-50' : 'bg-red-50';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Receitas
          </CardTitle>
          <div className="bg-green-50 p-2 rounded-lg">
            <ArrowUpCircle className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(dashboard.totalIncome)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Despesas
          </CardTitle>
          <div className="bg-red-50 p-2 rounded-lg">
            <ArrowDownCircle className="h-4 w-4 text-red-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(dashboard.totalExpense)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Saldo
          </CardTitle>
          <div className={`${balanceBgColor} p-2 rounded-lg`}>
            <DollarSign className={`h-4 w-4 ${balanceColor}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${balanceColor}`}>
            {formatCurrency(dashboard.balance)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Margem
          </CardTitle>
          <div className="bg-blue-50 p-2 rounded-lg">
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {dashboard.totalIncome > 0
              ? `${((dashboard.balance / dashboard.totalIncome) * 100).toFixed(1)}%`
              : '0%'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
