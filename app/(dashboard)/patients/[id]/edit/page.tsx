'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPatientByIdAction } from '@/actions/patient-actions';
import { PatientForm } from '@/components/patients/PatientForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Patient } from '@/types';

export default function EditPatientPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPatient() {
      try {
        const result = await getPatientByIdAction(patientId);
        if (result.success && result.data) {
          setPatient(result.data);
        } else {
          toast.error(result.error || 'Paciente não encontrado');
          router.push('/patients');
        }
      } catch {
        toast.error('Erro ao carregar dados do paciente');
        router.push('/patients');
      } finally {
        setIsLoading(false);
      }
    }

    if (patientId) {
      loadPatient();
    }
  }, [patientId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/patients/${patientId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Editar Paciente</h2>
          <p className="text-muted-foreground">
            Atualize os dados de {patient.fullName}
          </p>
        </div>
      </div>

      <PatientForm
        patient={patient}
        onSuccess={() => router.push(`/patients/${patientId}`)}
      />
    </div>
  );
}
