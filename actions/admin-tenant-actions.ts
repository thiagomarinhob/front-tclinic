"use server";

import { API_ROUTES } from "@/config/constants";
import { apiRequest } from "./_helpers";
import type {
  ActionResult,
  AdminListTenantsParams,
  AdminTenantDetail,
  AdminTenantsPage,
  PlanType,
} from "@/types";

export async function listAdminTenantsAction(
  params: AdminListTenantsParams = {},
): Promise<ActionResult<AdminTenantsPage>> {
  try {
    const data = await apiRequest<AdminTenantsPage>(API_ROUTES.ADMIN.TENANTS, {
      method: "GET",
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
        ...(params.status ? { status: params.status } : {}),
        ...(params.planType ? { planType: params.planType } : {}),
      },
      requireAuth: true,
    });

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao listar clínicas",
    };
  }
}

export async function getAdminTenantDetailAction(
  tenantId: string,
): Promise<ActionResult<AdminTenantDetail>> {
  try {
    if (!tenantId) {
      return { success: false, error: "ID da clínica é obrigatório" };
    }

    const data = await apiRequest<AdminTenantDetail>(
      API_ROUTES.ADMIN.TENANT_DETAIL(tenantId),
      { method: "GET", requireAuth: true },
    );

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao buscar clínica",
    };
  }
}

export async function suspendAdminTenantAction(
  tenantId: string,
): Promise<ActionResult> {
  return runTenantCommand(
    tenantId,
    API_ROUTES.ADMIN.SUSPEND_TENANT,
    "Erro ao suspender clínica",
  );
}

export async function reactivateAdminTenantAction(
  tenantId: string,
): Promise<ActionResult> {
  return runTenantCommand(
    tenantId,
    API_ROUTES.ADMIN.REACTIVATE_TENANT,
    "Erro ao reativar clínica",
  );
}

export async function extendAdminTenantTrialAction(
  tenantId: string,
  additionalDays: number,
): Promise<ActionResult<AdminTenantDetail>> {
  try {
    if (!tenantId) {
      return { success: false, error: "ID da clínica é obrigatório" };
    }

    if (!Number.isInteger(additionalDays) || additionalDays < 1 || additionalDays > 365) {
      return { success: false, error: "Informe entre 1 e 365 dias" };
    }

    const data = await apiRequest<AdminTenantDetail>(
      API_ROUTES.ADMIN.EXTEND_TRIAL(tenantId),
      {
        method: "POST",
        body: { additionalDays },
        requireAuth: true,
      },
    );

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao estender trial",
    };
  }
}

export async function changeAdminTenantPlanAction(
  tenantId: string,
  planType: PlanType,
): Promise<ActionResult> {
  try {
    if (!tenantId) {
      return { success: false, error: "ID da clínica é obrigatório" };
    }

    await apiRequest(API_ROUTES.ADMIN.CHANGE_PLAN(tenantId), {
      method: "PATCH",
      body: { planType },
      requireAuth: true,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao alterar plano",
    };
  }
}

async function runTenantCommand(
  tenantId: string,
  endpoint: (tenantId: string) => string,
  fallbackError: string,
): Promise<ActionResult> {
  try {
    if (!tenantId) {
      return { success: false, error: "ID da clínica é obrigatório" };
    }

    await apiRequest(endpoint(tenantId), {
      method: "POST",
      requireAuth: true,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : fallbackError,
    };
  }
}
