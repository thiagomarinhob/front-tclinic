import { Metadata } from 'next';
import { ProcedureForm } from '@/components/procedures/ProcedureForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Novo Procedimento - TClinic',
};

export default function NewProcedurePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/procedures">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Novo Procedimento</h2>
          <p className="text-muted-foreground">
            Preencha os dados para cadastrar um novo procedimento
          </p>
        </div>
      </div>
      <ProcedureForm />
    </div>
  );
}
