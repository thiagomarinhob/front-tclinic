'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getUserDetailAction, updateUserBlockedAction } from '@/actions/user-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Edit,
  User,
  Mail,
  Calendar,
  Building2,
  Loader2,
  Shield,
  Clock,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { UserDetailResponse } from '@/types';

function InfoItem({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value || '-'}</p>
    </div>
  );
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

function formatDateOnly(dateString: string | undefined): string {
  if (!dateString) return '-';
  try {
    // LocalDate do Java vem como 'YYYY-MM-DD'
    const date = new Date(dateString + 'T00:00:00');
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

function formatRole(role: string | undefined): string {
  if (!role) return '-';
  const roleLabels: Record<string, string> = {
    OWNER: 'Proprietário',
    ADMIN: 'Administrador',
    RECEPTION: 'Recepcionista',
    SPECIALIST: 'Especialista',
    FINANCE: 'Financeiro',
    READONLY: 'Somente Leitura',
  };
  return roleLabels[role] || role;
}

function formatTenantType(type: string | undefined): string {
  if (!type) return '-';
  const typeLabels: Record<string, string> = {
    CLINIC: 'Clínica',
    SOLO: 'Solo',
  };
  return typeLabels[type] || type;
}

function formatTenantStatus(status: string | undefined): string {
  if (!status) return '-';
  const statusLabels: Record<string, string> = {
    PENDING_SETUP: 'Configuração Pendente',
    TRIAL: 'Período de Teste',
    ACTIVE: 'Ativo',
    SUSPENDED: 'Suspenso',
    CANCELED: 'Cancelado',
  };
  return statusLabels[status] || status;
}

function formatPlanType(planType: string | undefined): string {
  if (!planType) return '-';
  const planLabels: Record<string, string> = {
    BASIC: 'Básico',
    PRO: 'Profissional',
    CUSTOM: 'Personalizado',
  };
  return planLabels[planType] || planType;
}

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [userDetail, setUserDetail] = useState<UserDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [blocked, setBlocked] = useState<boolean | null>(null);

  useEffect(() => {
    async function loadUserDetail() {
      try {
        const result = await getUserDetailAction(userId);
        if (result.success && result.data) {
          setUserDetail(result.data);
          // Não temos blocked no UserDetailResponse, então começamos com null
          // O usuário pode usar o botão para bloquear/desbloquear
        } else {
          toast.error(result.error || 'Usuário não encontrado');
          router.push('/users');
        }
      } catch {
        toast.error('Erro ao carregar dados do usuário');
        router.push('/users');
      } finally {
        setIsLoading(false);
      }
    }

    if (userId) {
      loadUserDetail();
    }
  }, [userId, router]);

  const handleToggleBlock = async () => {
    if (!userDetail) return;

    const newBlockedStatus = blocked === null || blocked === false ? true : false;
    const action = newBlockedStatus ? 'bloquear' : 'desbloquear';
    
    if (!confirm(`Tem certeza que deseja ${action} este usuário?`)) return;

    setIsUpdating(true);
    try {
      const result = await updateUserBlockedAction(userId, newBlockedStatus);
      if (result.success && result.data) {
        setBlocked(result.data.blocked);
        toast.success(`Usuário ${newBlockedStatus ? 'bloqueado' : 'desbloqueado'} com sucesso`);
        // Recarregar os dados do usuário
        const reloadResult = await getUserDetailAction(userId);
        if (reloadResult.success && reloadResult.data) {
          setUserDetail(reloadResult.data);
        }
      } else {
        toast.error(result.error || `Erro ao ${action} usuário`);
      }
    } catch {
      toast.error(`Erro ao ${action} usuário`);
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

  if (!userDetail) {
    return null;
  }

  const fullName = `${userDetail.firstName || ''} ${userDetail.lastName || ''}`.trim() || userDetail.email;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/users">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">{fullName}</h2>
            </div>
            <p className="text-muted-foreground">
              Detalhes do usuário
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={blocked === true ? "default" : "outline"}
            onClick={handleToggleBlock}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : blocked === true ? (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            ) : (
              <Ban className="mr-2 h-4 w-4" />
            )}
            {blocked === true ? 'Desbloquear' : 'Bloquear'}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/users/${userId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      {/* Informações Básicas do Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Informações do Usuário
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem label="Nome" value={userDetail.firstName || '-'} />
          <InfoItem label="Sobrenome" value={userDetail.lastName || '-'} />
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
            <InfoItem label="Email" value={userDetail.email} />
          </div>
        </CardContent>
      </Card>

      {/* Informações de Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Datas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
            <InfoItem label="Data de Criação" value={formatDate(userDetail.createdAt)} />
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
            <InfoItem label="Última Atualização" value={formatDate(userDetail.updatedAt)} />
          </div>
        </CardContent>
      </Card>

      {/* Clínicas e Roles Associados */}
      {userDetail.tenantRoles && userDetail.tenantRoles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Clínicas e Permissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userDetail.tenantRoles.map((tenantRole, index) => (
                <Card key={tenantRole.tenantId || index} className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <InfoItem 
                        label="Nome da Clínica" 
                        value={tenantRole.tenantName || '-'} 
                      />
                      <InfoItem 
                        label="Subdomínio" 
                        value={tenantRole.subdomain || '-'} 
                      />
                      <InfoItem 
                        label="Tipo" 
                        value={formatTenantType(tenantRole.tenantType)} 
                      />
                      <div>
                        <p className="text-sm text-muted-foreground">Role</p>
                        <Badge variant="outline" className="mt-1">
                          <Shield className="h-3 w-3 mr-1" />
                          {formatRole(tenantRole.role)}
                        </Badge>
                      </div>
                      <InfoItem 
                        label="Status da Clínica" 
                        value={formatTenantStatus(tenantRole.tenantStatus)} 
                      />
                      <InfoItem 
                        label="Plano" 
                        value={formatPlanType(tenantRole.planType)} 
                      />
                      <InfoItem 
                        label="Status" 
                        value={tenantRole.tenantActive ? 'Ativo' : 'Inativo'} 
                      />
                      {tenantRole.trialEndsAt && (
                        <InfoItem 
                          label="Fim do Período de Teste" 
                          value={formatDateOnly(tenantRole.trialEndsAt)} 
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
