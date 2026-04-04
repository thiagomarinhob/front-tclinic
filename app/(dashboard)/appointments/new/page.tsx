import { Metadata } from 'next';
import { Suspense } from 'react';
import { NewAppointmentForm } from '@/components/appointments/NewAppointmentForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Novo Agendamento - TClinic',
};

export default function NewAppointmentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/appointments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Novo Agendamento</h2>
          <p className="text-muted-foreground">
            Preencha os dados para criar um novo agendamento
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Carregando...</div>}>
        <NewAppointmentForm />
      </Suspense>
    </div>
  );
}