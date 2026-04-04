import { Metadata } from 'next';
import { PatientForm } from '@/components/patients/PatientForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Novo Paciente - TClinic',
};

export default function NewPatientPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/patients">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Novo Paciente</h2>
          <p className="text-muted-foreground">
            Preencha os dados para cadastrar um novo paciente
          </p>
        </div>
      </div>
      <PatientForm />
    </div>
  );
}
