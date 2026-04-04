import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Plus, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/constants';
import { getLabDashboardAction } from '@/actions/laboratory-actions';
import { LabDashboardStats } from '@/components/laboratory/LabDashboardStats';

export const metadata: Metadata = {
  title: 'Laboratório - TClinic',
};

export default async function LaboratoryPage() {
  const dashboardResult = await getLabDashboardAction();
  const dashboard = dashboardResult.success && dashboardResult.data
    ? dashboardResult.data
    : { totalRequested: 0, totalCollected: 0, totalInAnalysis: 0, totalCompleted: 0, pendingResults: 0, awaitingValidation: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Laboratório</h2>
          <p className="text-muted-foreground">
            Gestão do ciclo laboratorial — da solicitação à liberação do resultado
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={ROUTES.LABORATORY_EXAM_TYPES}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Catálogo de Exames
            </Link>
          </Button>
          <Button asChild>
            <Link href={ROUTES.LABORATORY_ORDERS_NEW}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Solicitação
            </Link>
          </Button>
        </div>
      </div>

      <LabDashboardStats dashboard={dashboard} />

      <div className="flex justify-center">
        <Button asChild variant="outline" size="lg">
          <Link href={ROUTES.LABORATORY_ORDERS}>
            Ver todas as solicitações
          </Link>
        </Button>
      </div>
    </div>
  );
}
