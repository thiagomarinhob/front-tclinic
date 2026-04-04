import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/constants';
import { LabOrderList } from '@/components/laboratory/LabOrderList';

export const metadata: Metadata = {
  title: 'Solicitações Laboratoriais - TClinic',
};

export default function LabOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href={ROUTES.LABORATORY}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Laboratório
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Solicitações Laboratoriais</h2>
            <p className="text-muted-foreground">Acompanhe o status de todas as solicitações</p>
          </div>
        </div>
        <Button asChild>
          <Link href={ROUTES.LABORATORY_ORDERS_NEW}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Solicitação
          </Link>
        </Button>
      </div>

      <LabOrderList />
    </div>
  );
}
