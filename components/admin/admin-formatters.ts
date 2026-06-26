import type { PlanType, SubscriptionStatus, TenantStatus, TypeTenant } from "@/types";

export function formatDateTime(value?: string) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatDateOnly(value?: string) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
  } catch {
    return value;
  }
}

export function formatMoney(amount?: number, currency = "BRL") {
  if (amount === undefined || amount === null) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatTenantStatus(status?: TenantStatus) {
  const labels: Record<TenantStatus, string> = {
    PENDING_SETUP: "Configuração pendente",
    TRIAL: "Trial",
    ACTIVE: "Ativa",
    SUSPENDED: "Suspensa",
    CANCELED: "Cancelada",
  };
  return status ? labels[status] : "-";
}

export function formatPlanType(plan?: PlanType) {
  const labels: Record<PlanType, string> = {
    SOLO: "Solo",
    BASIC: "Basic",
    PRO: "Pro",
    CUSTOM: "Custom",
  };
  return plan ? labels[plan] : "-";
}

export function formatTenantType(type?: TypeTenant) {
  const labels: Record<TypeTenant, string> = {
    CLINIC: "Clínica",
    SOLO: "Solo",
  };
  return type ? labels[type] : "-";
}

export function formatSubscriptionStatus(status?: SubscriptionStatus) {
  if (!status) return "-";
  const labels: Record<string, string> = {
    PENDING: "Pendente",
    ACTIVE: "Ativa",
    CANCELED: "Cancelada",
    PAST_DUE: "Em atraso",
    TRIALING: "Trial",
    UNPAID: "Não paga",
  };
  return labels[status] || status;
}
