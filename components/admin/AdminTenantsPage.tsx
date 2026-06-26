"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarPlus, Eye, Filter, PauseCircle, PlayCircle, RefreshCcw, SlidersHorizontal } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/config/constants";
import { useAdminTenantMutations, useAdminTenants } from "@/hooks/useAdminTenants";
import type { AdminTenantListItem, PlanType, TenantStatus } from "@/types";
import {
  formatDateOnly,
  formatDateTime,
  formatMoney,
  formatPlanType,
  formatSubscriptionStatus,
  formatTenantStatus,
  formatTenantType,
} from "./admin-formatters";
import { ChangePlanDialog, ExtendTrialDialog } from "./AdminTenantDialogs";

const STATUS_OPTIONS: TenantStatus[] = ["PENDING_SETUP", "TRIAL", "ACTIVE", "SUSPENDED", "CANCELED"];
const PLAN_OPTIONS: PlanType[] = ["SOLO", "BASIC", "PRO", "CUSTOM"];

function statusVariant(status: TenantStatus) {
  if (status === "ACTIVE" || status === "TRIAL") return "default";
  if (status === "SUSPENDED" || status === "CANCELED") return "destructive";
  return "secondary";
}

function ownerName(tenant: AdminTenantListItem) {
  if (!tenant.owner) return "-";
  return `${tenant.owner.firstName ?? ""} ${tenant.owner.lastName ?? ""}`.trim() || tenant.owner.email;
}

export function AdminTenantsPage() {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<"all" | TenantStatus>("all");
  const [planType, setPlanType] = useState<"all" | PlanType>("all");
  const [confirmAction, setConfirmAction] = useState<{
    type: "suspend" | "reactivate";
    tenant: AdminTenantListItem;
  } | null>(null);
  const [planTenant, setPlanTenant] = useState<AdminTenantListItem | null>(null);
  const [trialTenant, setTrialTenant] = useState<AdminTenantListItem | null>(null);
  const size = 20;

  const tenantsQuery = useAdminTenants({
    page,
    size,
    status: status === "all" ? undefined : status,
    planType: planType === "all" ? undefined : planType,
  });
  const mutations = useAdminTenantMutations();

  const tenants = tenantsQuery.data?.content ?? [];
  const totalPages = tenantsQuery.data?.totalPages ?? 0;
  const totalElements = tenantsQuery.data?.totalElements ?? 0;

  const resetPage = () => setPage(0);

  const handleConfirm = () => {
    if (!confirmAction) return;
    const tenantId = confirmAction.tenant.id;
    if (confirmAction.type === "suspend") {
      mutations.suspend.mutate(tenantId);
    } else {
      mutations.reactivate.mutate(tenantId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tenants</h2>
          <p className="text-muted-foreground">
            Gerencie status, trial e plano das clínicas da plataforma.
          </p>
        </div>
        <Button variant="outline" onClick={() => tenantsQuery.refetch()}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filtros
            </div>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as "all" | TenantStatus);
                resetPage();
              }}
            >
              <SelectTrigger className="w-full sm:w-[210px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {formatTenantStatus(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={planType}
              onValueChange={(value) => {
                setPlanType(value as "all" | PlanType);
                resetPage();
              }}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                {PLAN_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {formatPlanType(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(status !== "all" || planType !== "all") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStatus("all");
                  setPlanType("all");
                  resetPage();
                }}
              >
                Limpar filtros
              </Button>
            )}
            <div className="ml-auto text-sm text-muted-foreground">
              {totalElements} {totalElements === 1 ? "tenant" : "tenants"}
            </div>
          </div>
        </CardContent>
      </Card>

      {tenantsQuery.isLoading ? (
        <LoadingSpinner />
      ) : tenantsQuery.error ? (
        <Card>
          <CardContent className="p-6 text-center text-destructive">
            {tenantsQuery.error instanceof Error
              ? tenantsQuery.error.message
              : "Erro ao carregar tenants"}
          </CardContent>
        </Card>
      ) : tenants.length === 0 ? (
        <EmptyState title="Nenhum tenant encontrado" description="Ajuste os filtros para ampliar a busca." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clínica</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Trial</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Assinatura</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div className="max-w-[260px]">
                        <p className="truncate font-medium">{tenant.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {tenant.subdomain || tenant.cnpj || tenant.id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(tenant.status)}>
                        {formatTenantStatus(tenant.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatPlanType(tenant.planType)}</TableCell>
                    <TableCell>{formatTenantType(tenant.type)}</TableCell>
                    <TableCell>{formatDateOnly(tenant.trialEndsAt)}</TableCell>
                    <TableCell>
                      <div className="max-w-[220px]">
                        <p className="truncate">{ownerName(tenant)}</p>
                        <p className="truncate text-xs text-muted-foreground">{tenant.owner?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{formatSubscriptionStatus(tenant.subscription?.status)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatMoney(tenant.subscription?.amount, tenant.subscription?.currency)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(tenant.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild title="Ver detalhes">
                          <Link href={ROUTES.ADMIN_TENANT_DETAIL(tenant.id)}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Alterar plano"
                          disabled={tenant.status === "CANCELED"}
                          onClick={() => setPlanTenant(tenant)}
                        >
                          <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Estender trial"
                          disabled={tenant.status === "CANCELED"}
                          onClick={() => setTrialTenant(tenant)}
                        >
                          <CalendarPlus className="h-4 w-4" />
                        </Button>
                        {tenant.status === "SUSPENDED" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Reativar"
                            onClick={() => setConfirmAction({ type: "reactivate", tenant })}
                          >
                            <PlayCircle className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Suspender"
                            disabled={tenant.status !== "ACTIVE" && tenant.status !== "TRIAL"}
                            onClick={() => setConfirmAction({ type: "suspend", tenant })}
                          >
                            <PauseCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((value) => value + 1)}
          >
            Próxima
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={confirmAction?.type === "reactivate" ? "Reativar tenant" : "Suspender tenant"}
        description={
          confirmAction
            ? `Confirma ${confirmAction.type === "reactivate" ? "a reativação" : "a suspensão"} de ${confirmAction.tenant.name}?`
            : ""
        }
        confirmText={confirmAction?.type === "reactivate" ? "Reativar" : "Suspender"}
        variant={confirmAction?.type === "suspend" ? "destructive" : "default"}
        isLoading={mutations.suspend.isPending || mutations.reactivate.isPending}
      />

      <ChangePlanDialog
        open={!!planTenant}
        currentPlan={planTenant?.planType}
        isLoading={mutations.changePlan.isPending}
        onOpenChange={(open) => !open && setPlanTenant(null)}
        onSubmit={(nextPlan) => {
          if (!planTenant) return;
          mutations.changePlan.mutate(
            { id: planTenant.id, planType: nextPlan },
            { onSuccess: (result) => result.success && setPlanTenant(null) },
          );
        }}
      />

      <ExtendTrialDialog
        open={!!trialTenant}
        isLoading={mutations.extendTrial.isPending}
        onOpenChange={(open) => !open && setTrialTenant(null)}
        onSubmit={(additionalDays) => {
          if (!trialTenant) return;
          mutations.extendTrial.mutate(
            { id: trialTenant.id, additionalDays },
            { onSuccess: (result) => result.success && setTrialTenant(null) },
          );
        }}
      />
    </div>
  );
}
