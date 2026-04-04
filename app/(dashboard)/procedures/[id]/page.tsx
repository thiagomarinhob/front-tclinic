'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProcedureByIdAction, deleteProcedureAction } from '@/actions/procedure-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Clock,
  DollarSign,
  Percent,
  Loader2,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Procedure } from '@/types';
import { formatCurrency } from '@/lib/utils';

function InfoItem({ label, value }: { label: string; value: string | undefined | number }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value !== undefined && value !== null ? String(value) : '-'}</p>
    </div>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

export default function ProcedureDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const procedureId = params.id as string;

  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteProcedureAction(procedureId);
      if (result.success) {
        toast.success('Procedimento excluído com sucesso');
        router.push('/procedures');
      } else {
        toast.error(result.error || 'Erro ao excluir procedimento');
        setDeleteDialogOpen(false);
      }
    } catch {
      toast.error('Erro ao excluir procedimento');
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/procedures">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">{procedure.name}</h2>
              {!procedure.active && (
                <Badge variant="secondary">Inativo</Badge>
              )}
              {procedure.active && (
                <Badge variant="default" className="bg-green-600">Ativo</Badge>
              )}
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Cadastrado em {new Date(procedure.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/procedures/${procedureId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Excluir
          </Button>
        </div>
      </div>

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoItem label="Nome do Procedimento" value={procedure.name} />
          {procedure.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Descrição</p>
              <p className="text-sm whitespace-pre-wrap">{procedure.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Duração e Valores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Duração e Valores
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
            <InfoItem 
              label="Duração Estimada" 
              value={formatDuration(procedure.estimatedDurationMinutes)} 
            />
          </div>
          <div className="flex items-start gap-2">
            <DollarSign className="h-4 w-4 mt-1 text-muted-foreground" />
            <InfoItem 
              label="Preço Base" 
              value={formatCurrency(procedure.basePrice)} 
            />
          </div>
          {procedure.professionalCommissionPercent !== undefined && procedure.professionalCommissionPercent !== null && (
            <div className="flex items-start gap-2">
              <Percent className="h-4 w-4 mt-1 text-muted-foreground" />
              <InfoItem 
                label="Comissão do Profissional" 
                value={`${procedure.professionalCommissionPercent}%`} 
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Informações Adicionais
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <InfoItem 
            label="Status" 
            value={procedure.active ? 'Ativo' : 'Inativo'} 
          />
          <InfoItem 
            label="Última Atualização" 
            value={new Date(procedure.updatedAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })} 
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Excluir procedimento"
        description={`Tem certeza que deseja excluir o procedimento "${procedure.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
