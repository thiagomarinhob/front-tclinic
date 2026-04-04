'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProfessionalByIdAction, updateProfessionalActiveAction } from '@/actions/professional-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Edit,
  User,
  GraduationCap,
  FileText,
  Mail,
  Phone,
  Loader2,
  UserCheck,
  UserX,
  Clock,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Professional } from '@/types';
import { SPECIALTY_LABELS } from '@/types';
import type { Procedure } from '@/types/procedure.types';
import { DocumentType } from '@/types/professional.types';
import { ProcedureList } from '@/components/procedures/ProcedureList';
import { ProcedureForm } from '@/components/procedures/ProcedureForm';

const documentTypeLabels: Record<DocumentType, string> = {
  [DocumentType.CRM]: 'CRM - Conselho Regional de Medicina',
  [DocumentType.CREFITO]: 'CREFITO - Conselho Regional de Fisioterapia',
  [DocumentType.CRO]: 'CRO - Conselho Regional de Odontologia',
  [DocumentType.CRP]: 'CRP - Conselho Regional de Psicologia',
  [DocumentType.CRN]: 'CRN - Conselho Regional de Nutricionistas',
  [DocumentType.COREN]: 'COREN - Conselho Regional de Enfermagem',
  [DocumentType.OUTRO]: 'OUTRO',
};

function InfoItem({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value || '-'}</p>
    </div>
  );
}

export default function ProfessionalDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const professionalId = params.id as string;

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isProcedureFormOpen, setIsProcedureFormOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | undefined>(undefined);

  useEffect(() => {
    async function loadProfessional() {
      try {
        const result = await getProfessionalByIdAction(professionalId);
        console.log("🚀 ~ loadProfessional ~ result:", result)
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

  const handleToggleActive = async () => {
    if (!professional) return;

    const newStatus = !professional.isActive;
    const action = newStatus ? 'ativar' : 'desativar';

    if (!confirm(`Tem certeza que deseja ${action} este profissional?`)) return;

    setIsUpdating(true);
    try {
      const result = await updateProfessionalActiveAction(professionalId, newStatus);
      if (result.success && result.data) {
        setProfessional(result.data);
        toast.success(`Profissional ${newStatus ? 'ativado' : 'desativado'} com sucesso`);
      } else {
        toast.error(result.error || `Erro ao ${action} profissional`);
      }
    } catch {
      toast.error(`Erro ao ${action} profissional`);
    } finally {
      setIsUpdating(false);
    }
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/professionals">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">{professional.user.fullName}</h2>
              {!professional.isActive && (
                <Badge variant="secondary">Inativo</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Profissional cadastrado
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={professional.isActive ? "outline" : "default"}
            onClick={handleToggleActive}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : professional.isActive ? (
              <UserX className="mr-2 h-4 w-4" />
            ) : (
              <UserCheck className="mr-2 h-4 w-4" />
            )}
            {professional.isActive ? 'Desativar' : 'Ativar'}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/professionals/${professionalId}/schedule`}>
              <Clock className="mr-2 h-4 w-4" />
              Horários
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/professionals/${professionalId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="procedures">Procedimentos</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          {/* Informações do Usuário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Informações do Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem label="Nome Completo" value={professional.user.fullName} />
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                <InfoItem label="Email" value={professional.user.email} />
              </div>
              {professional.user.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                  <InfoItem label="Telefone" value={professional.user.phone} />
                </div>
              )}
              <InfoItem
                label="Status"
                value={professional.user.isActive ? 'Ativo' : 'Inativo'}
              />
            </CardContent>
          </Card>

          {/* Informações Profissionais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="h-5 w-5" />
                Informações Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Especialidade" value={SPECIALTY_LABELS[professional.specialty] || professional.specialty} />
              <InfoItem
                label="Tipo de Documento"
                value={documentTypeLabels[professional.documentType] || professional.documentType}
              />
              <InfoItem label="Número do Documento" value={professional.documentNumber} />
              <InfoItem
                label="Estado do Documento (UF)"
                value={professional.documentState || '-'}
              />
            </CardContent>
          </Card>

          {/* Biografia */}
          {professional.bio && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Biografia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{professional.bio}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="procedures" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => {
              setEditingProcedure(undefined);
              setIsProcedureFormOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Procedimento
            </Button>
          </div>

          <ProcedureList
            professionalId={professionalId}
            onEdit={(procedure) => {
              setEditingProcedure(procedure);
              setIsProcedureFormOpen(true);
            }}
          />

          <Dialog open={isProcedureFormOpen} onOpenChange={setIsProcedureFormOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingProcedure ? 'Editar Procedimento' : 'Novo Procedimento'}
                </DialogTitle>
              </DialogHeader>
              <ProcedureForm
                procedure={editingProcedure}
                onSuccess={() => setIsProcedureFormOpen(false)}
                professionalId={professionalId}
              />
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
