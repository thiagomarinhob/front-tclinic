import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/constants';
import { ExamTypeList } from '@/components/laboratory/ExamTypeList';

export const metadata: Metadata = {
  title: 'Catálogo de Exames - TClinic',
};

export default function ExamTypesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={ROUTES.LABORATORY}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Laboratório
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Catálogo de Exames</h2>
          <p className="text-muted-foreground">
            Gerencie os tipos de exame com faixas de referência, unidades e preparo necessário
          </p>
        </div>
      </div>

      <ExamTypeList />
    </div>
  );
}
