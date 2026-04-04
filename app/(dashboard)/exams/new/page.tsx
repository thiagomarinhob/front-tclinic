import { Metadata } from 'next';
import { CreateExamForm } from '@/components/exams/CreateExamForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Novo Exame - TClinic',
};

export default function NewExamPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/exams">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Novo exame</h2>
          <p className="text-muted-foreground">
            Registre um pedido de exame para o paciente
          </p>
        </div>
      </div>
      <CreateExamForm />
    </div>
  );
}
