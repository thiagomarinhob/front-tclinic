import { formatCurrency as formatCurrencyUtil } from '@/lib/utils';

export type TransactionType = 'receita' | 'despesa';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  category: string;
  amount: number;
  patient?: string;
  paymentMethod: string;
}

export function formatCurrency(value: number): string {
  return formatCurrencyUtil(value);
}
