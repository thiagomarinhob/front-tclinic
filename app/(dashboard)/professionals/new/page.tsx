import { Metadata } from 'next';
import { ProfessionalForm } from '@/components/professionals/ProfessionalForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Novo Profissional - TClinic',
};

export default function NewProfessionalPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/professionals">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Novo Profissional</h2>
          <p className="text-muted-foreground">
            Preencha os dados para cadastrar um novo profissional
          </p>
        </div>
      </div>

      <ProfessionalForm />
    </div>
  );
}
