'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProfessionalByIdAction } from '@/actions/professional-actions';
import { ProfessionalScheduleForm } from '@/components/professionals/ProfessionalScheduleForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Professional } from '@/types';

export default function ProfessionalSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const professionalId = params.id as string;

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfessional() {
      try {
        const result = await getProfessionalByIdAction(professionalId);
        if (result.success && result.data) {
          setProfessional(result.data);
        } else {
          toast.error(result.error || 'Profissional não encontrado');
          router.push('/professionals');
        }
      } catch {
        toast.error('Erro ao carregar dados do profissional');
        router.push('/professionals');
      } finally {
        setIsLoading(false);
      }
    }

    if (professionalId) {
      loadProfessional();
    }
  }, [professionalId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!professional) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/professionals/${professionalId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configurar Horários</h2>
          <p className="text-muted-foreground">
            Configure os horários de trabalho para {professional.user.fullName}
          </p>
        </div>
      </div>

      <ProfessionalScheduleForm
        professionalId={professionalId}
        professionalName={professional.user.fullName}
      />
    </div>
  );
}
