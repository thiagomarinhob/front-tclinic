'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProcedureByIdAction } from '@/actions/procedure-actions';
import { ProcedureForm } from '@/components/procedures/ProcedureForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Procedure } from '@/types';

export default function EditProcedurePage() {
  const params = useParams();
  const router = useRouter();
  const procedureId = params.id as string;

  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProcedure() {
      try {
        const result = await getProcedureByIdAction(procedureId);
        if (result.success && result.data) {
          setProcedure(result.data);
        } else {
          toast.error(result.error || 'Procedimento não encontrado');
          router.push('/procedures');
        }
      } catch {
        toast.error('Erro ao carregar dados do procedimento');
        router.push('/procedures');
      } finally {
        setIsLoading(false);
      }
    }

    if (procedureId) {
      loadProcedure();
    }
  }, [procedureId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!procedure) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/procedures/${procedureId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Editar Procedimento</h2>
          <p className="text-muted-foreground">
            Atualize os dados de {procedure.name}
          </p>
        </div>
      </div>

      <ProcedureForm
        procedure={procedure}
        onSuccess={() => router.push(`/procedures/${procedureId}`)}
      />
    </div>
  );
}
