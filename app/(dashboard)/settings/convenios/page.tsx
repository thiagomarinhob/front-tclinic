import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/constants';
import { HealthPlanList } from '@/components/settings/HealthPlanList';

export const metadata: Metadata = {
  title: 'Convênios - TClinic',
};

export default function ConveniosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={ROUTES.SETTINGS}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Configurações
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Convênios</h2>
          <p className="text-muted-foreground">
            Gerencie os convênios aceitos pela clínica
          </p>
        </div>
      </div>

      <HealthPlanList />
    </div>
  );
}
