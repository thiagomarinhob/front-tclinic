import { Metadata } from 'next';
import { ExamList } from '@/components/exams/ExamList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Exames - TClinic',
};

export default function ExamsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Exames</h2>
          <p className="text-muted-foreground">
            Pedidos de exame e resultados da clínica
          </p>
        </div>
        <Button asChild>
          <Link href="/exams/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo exame
          </Link>
        </Button>
      </div>

      <ExamList />
    </div>
  );
}
