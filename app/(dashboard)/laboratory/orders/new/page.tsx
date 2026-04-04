import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/constants';
import { LabOrderForm } from '@/components/laboratory/LabOrderForm';

export const metadata: Metadata = {
  title: 'Nova Solicitação Laboratorial - TClinic',
};

export default function NewLabOrderPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={ROUTES.LABORATORY_ORDERS}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Solicitações
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Nova Solicitação Laboratorial</h2>
          <p className="text-muted-foreground">Preencha os dados e adicione os exames solicitados</p>
        </div>
      </div>

      <LabOrderForm />
    </div>
  );
}
