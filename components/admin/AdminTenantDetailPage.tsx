"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CalendarPlus, PauseCircle, PlayCircle, SlidersHorizontal } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/config/constants";
import { useAdminTenantDetail, useAdminTenantMutations } from "@/hooks/useAdminTenants";
import type { TenantStatus } from "@/types";
import { ChangePlanDialog, ExtendTrialDialog } from "./AdminTenantDialogs";
import {
  formatDateOnly,
  formatDateTime,
  formatMoney,
  formatPlanType,
  formatSubscriptionStatus,
  formatTenantStatus,
  formatTenantType,
} from "./admin-formatters";

function statusVariant(status?: TenantStatus) {
  if (status === "ACTIVE" || status === "TRIAL") return "default";
  if (status === "SUSPENDED" || status === "CANCELED") return "destructive";
  return "secondary";
}

function InfoItem({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-1 break-words font-medium">{value || "-"}</div>
    </div>
  );
}

export function AdminTenantDetailPage() {
  const params = useParams<{ id: string }>();
  const tenantId = params.id;
  const tenantQuery = useAdminTenantDetail(tenantId);
  const mutations = useAdminTenantMutations(tenantId);
  const [confirmAction, setConfirmAction] = useState<"suspend" | "reactivate" | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [trialOpen, setTrialOpen] = useState(false);

  const tenant = tenantQuery.data;

  if (tenantQuery.isLoading) {
    return <LoadingSpinner />;
  }

  if (tenantQuery.error || !tenant) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-destructive">
          {tenantQuery.error instanceof Error
            ? tenantQuery.error.message
            : "Tenant não encontrado"}
        </CardContent>
      </Card>
    );
  }

  const ownerName =
    `${tenant.owner?.firstName ?? ""} ${tenant.owner?.lastName ?? ""}`.trim() ||
    tenant.owner?.email;

  const canSuspend = tenant.status === "ACTIVE" || tenant.status === "TRIAL";
  const canReactivate = tenant.status === "SUSPENDED";
  const canMutatePlan = tenant.status !== "CANCELED";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href={ROUTES.ADMIN_TENANTS}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{tenant.name}</h2>
              <Badge variant={statusVariant(tenant.status)}>
                {formatTenantStatus(tenant.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground">{tenant.subdomain || tenant.id}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={!canMutatePlan} onClick={() => setPlanOpen(true)}>
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Alterar plano
          </Button>
          <Button variant="outline" disabled={!canMutatePlan} onClick={() => setTrialOpen(true)}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Estender trial
          </Button>
          {canReactivate ? (
            <Button onClick={() => setConfirmAction("reactivate")}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Reativar
            </Button>
          ) : (
            <Button variant="destructive" disabled={!canSuspend} onClick={() => setConfirmAction("suspend")}>
              <PauseCircle className="mr-2 h-4 w-4" />
              Suspender
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dados da clínica</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <InfoItem label="ID" value={tenant.id} />
            <InfoItem label="CNPJ" value={tenant.cnpj} />
            <InfoItem label="Subdomínio" value={tenant.subdomain} />
            <InfoItem label="Tipo" value={formatTenantType(tenant.type)} />
            <InfoItem label="Status" value={formatTenantStatus(tenant.status)} />
            <InfoItem label="Plano" value={formatPlanType(tenant.planType)} />
            <InfoItem label="Fim do trial" value={formatDateOnly(tenant.trialEndsAt)} />
            <InfoItem label="Telefone" value={tenant.phone} />
            <InfoItem label="Endereço" value={tenant.address} />
            <InfoItem label="Logo object key" value={tenant.logoObjectKey} />
            <InfoItem label="Criada em" value={formatDateTime(tenant.createdAt)} />
            <InfoItem label="Atualizada em" value={formatDateTime(tenant.updatedAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Owner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem label="Nome" value={ownerName} />
            <InfoItem label="Email" value={tenant.owner?.email} />
            <InfoItem label="Telefone" value={tenant.owner?.phone} />
            <InfoItem label="User ID" value={tenant.owner?.userId} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assinatura</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem label="Status" value={formatSubscriptionStatus(tenant.subscription?.status)} />
          <InfoItem
            label="Valor"
            value={formatMoney(tenant.subscription?.amount, tenant.subscription?.currency)}
          />
          <InfoItem label="Período atual início" value={formatDateTime(tenant.subscription?.currentPeriodStart)} />
          <InfoItem label="Período atual fim" value={formatDateTime(tenant.subscription?.currentPeriodEnd)} />
          <InfoItem label="Cancelada em" value={formatDateTime(tenant.subscription?.canceledAt)} />
          <InfoItem label="Criada em" value={formatDateTime(tenant.subscription?.createdAt)} />
          <InfoItem label="Stripe subscription" value={tenant.subscription?.stripeSubscriptionId} />
          <InfoItem label="Stripe customer" value={tenant.subscription?.stripeCustomerId} />
          <InfoItem label="Checkout session" value={tenant.subscription?.stripeCheckoutSessionId} />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction === "reactivate") {
            mutations.reactivate.mutate(tenant.id);
          } else if (confirmAction === "suspend") {
            mutations.suspend.mutate(tenant.id);
          }
        }}
        title={confirmAction === "reactivate" ? "Reativar tenant" : "Suspender tenant"}
        description={`Confirma ${confirmAction === "reactivate" ? "a reativação" : "a suspensão"} de ${tenant.name}?`}
        confirmText={confirmAction === "reactivate" ? "Reativar" : "Suspender"}
        variant={confirmAction === "suspend" ? "destructive" : "default"}
        isLoading={mutations.suspend.isPending || mutations.reactivate.isPending}
      />

      <ChangePlanDialog
        open={planOpen}
        currentPlan={tenant.planType}
        isLoading={mutations.changePlan.isPending}
        onOpenChange={setPlanOpen}
        onSubmit={(planType) => {
          mutations.changePlan.mutate(
            { id: tenant.id, planType },
            { onSuccess: (result) => result.success && setPlanOpen(false) },
          );
        }}
      />

      <ExtendTrialDialog
        open={trialOpen}
        isLoading={mutations.extendTrial.isPending}
        onOpenChange={setTrialOpen}
        onSubmit={(additionalDays) => {
          mutations.extendTrial.mutate(
            { id: tenant.id, additionalDays },
            { onSuccess: (result) => result.success && setTrialOpen(false) },
          );
        }}
      />
    </div>
  );
}
