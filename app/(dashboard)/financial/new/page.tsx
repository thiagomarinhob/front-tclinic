'use client'

import { FinancialTransactionForm } from '@/components/financial/FinancialTransactionForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/constants';

export default function NewFinancialTransactionPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={ROUTES.FINANCIAL}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Nova Transação Financeira</h2>
          <p className="text-muted-foreground">
            Cadastre uma nova receita ou despesa
          </p>
        </div>
      </div>
      <FinancialTransactionForm />
    </div>
  );
}
