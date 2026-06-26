"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  changeAdminTenantPlanAction,
  extendAdminTenantTrialAction,
  getAdminTenantDetailAction,
  listAdminTenantsAction,
  reactivateAdminTenantAction,
  suspendAdminTenantAction,
} from "@/actions/admin-tenant-actions";
import type { AdminListTenantsParams, PlanType } from "@/types";

const ADMIN_TENANTS_KEY = "admin-tenants";

export function useAdminTenants(params: AdminListTenantsParams) {
  return useQuery({
    queryKey: [ADMIN_TENANTS_KEY, params],
    queryFn: async () => {
      const result = await listAdminTenantsAction(params);
      if (!result.success) {
        throw new Error(result.error || "Erro ao listar clínicas");
      }
      return result.data;
    },
  });
}

export function useAdminTenantDetail(tenantId: string) {
  return useQuery({
    queryKey: [ADMIN_TENANTS_KEY, "detail", tenantId],
    queryFn: async () => {
      const result = await getAdminTenantDetailAction(tenantId);
      if (!result.success) {
        throw new Error(result.error || "Erro ao buscar clínica");
      }
      return result.data;
    },
    enabled: !!tenantId,
  });
}

export function useAdminTenantMutations(tenantId?: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [ADMIN_TENANTS_KEY] });
    if (tenantId) {
      queryClient.invalidateQueries({
        queryKey: [ADMIN_TENANTS_KEY, "detail", tenantId],
      });
    }
  };

  const suspend = useMutation({
    mutationFn: (id: string) => suspendAdminTenantAction(id),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Erro ao suspender clínica");
        return;
      }
      toast.success("Clínica suspensa com sucesso");
      invalidate();
    },
  });

  const reactivate = useMutation({
    mutationFn: (id: string) => reactivateAdminTenantAction(id),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Erro ao reativar clínica");
        return;
      }
      toast.success("Clínica reativada com sucesso");
      invalidate();
    },
  });

  const extendTrial = useMutation({
    mutationFn: ({ id, additionalDays }: { id: string; additionalDays: number }) =>
      extendAdminTenantTrialAction(id, additionalDays),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Erro ao estender trial");
        return;
      }
      toast.success("Trial estendido com sucesso");
      invalidate();
    },
  });

  const changePlan = useMutation({
    mutationFn: ({ id, planType }: { id: string; planType: PlanType }) =>
      changeAdminTenantPlanAction(id, planType),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Erro ao alterar plano");
        return;
      }
      toast.success("Plano alterado com sucesso");
      invalidate();
    },
  });

  return {
    suspend,
    reactivate,
    extendTrial,
    changePlan,
  };
}
