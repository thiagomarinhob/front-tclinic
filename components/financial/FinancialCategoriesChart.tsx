'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategorySummary } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface FinancialCategoriesChartProps {
  title: string;
  categories: CategorySummary[];
  type: 'income' | 'expense';
}

export function FinancialCategoriesChart({ 
  title, 
  categories, 
  type 
}: FinancialCategoriesChartProps) {
  const total = categories.reduce((sum, cat) => sum + cat.totalAmount, 0);
  const color = type === 'income' ? 'text-green-600' : 'text-red-600';

  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma {type === 'income' ? 'receita' : 'despesa'} encontrada
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map((category, index) => {
            const percentage = total > 0 ? (category.totalAmount / total) * 100 : 0;
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{category.categoryName || 'Sem categoria'}</span>
                  <span className={color}>{formatCurrency(category.totalAmount)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {percentage.toFixed(1)}% do total
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className={`font-bold ${color}`}>{formatCurrency(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
