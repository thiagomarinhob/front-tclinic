"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllProceduresAction,
  getProcedureByIdAction,
  createProcedureAction,
  updateProcedureAction,
  deleteProcedureAction,
} from "@/actions/procedure-actions";
import type { CreateProcedureRequest, UpdateProcedureRequest } from "@/types";
import { toast } from "sonner";

export type ProcedureListFilters = {
  search?: string;
  active?: boolean | null; // null = todos, true = ativos, false = inativos
  professionalId?: string;
};

export type UseProceduresOptions = {
  /** Quando true, só busca se tenantId estiver definido. Quando informado false, desativa a query (ex.: agendamento: só buscar procedimentos após selecionar profissional). */
  enabled?: boolean;
};

export function useProcedures(
  tenantId: string | null,
  page: number = 0,
  size: number = 20,
  filters?: ProcedureListFilters,
  options?: UseProceduresOptions,
) {
  const queryClient = useQueryClient();
  const search = filters?.search?.trim() ?? "";
  const active = filters?.active;
  const professionalId = filters?.professionalId;
  const enabled = options?.enabled !== false && !!tenantId;

  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "procedures",
      tenantId,
      page,
      size,
      search,
      active,
      professionalId,
    ],
    queryFn: async () => {
      if (!tenantId) {
        return {
          success: false,
          data: {
            content: [],
            totalElements: 0,
            totalPages: 0,
            size,
            number: page,
          },
        };
      }
      return await getAllProceduresAction(tenantId, page, size, {
        search: search || undefined,
        active: active !== undefined && active !== null ? active : undefined,
        professionalId: professionalId || undefined,
      });
    },
    enabled,
  });

  const procedures = result?.success ? result.data : null;

  // Criar procedimento
  const createMutation = useMutation({
    mutationFn: (data: CreateProcedureRequest) => createProcedureAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
      toast.success("Procedimento cadastrado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao cadastrar procedimento");
    },
  });

  // Atualizar procedimento
  const updateMutation = useMutation({
    mutationFn: async ({
      procedureId,
      data,
    }: {
      procedureId: string;
      data: UpdateProcedureRequest;
    }) => {
      const result = await updateProcedureAction(procedureId, data);
      if (!result.success) {
        throw new Error(result.error ?? "Erro ao atualizar procedimento");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
      toast.success("Procedimento atualizado com sucesso!");
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar procedimento",
      );
    },
  });

  // Excluir procedimento
  const deleteMutation = useMutation({
    mutationFn: (procedureId: string) => deleteProcedureAction(procedureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procedures"] });
      toast.success("Procedimento excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir procedimento");
    },
  });

  return {
    procedures,
    isLoading,
    error,
    refetch,
    createProcedure: createMutation.mutateAsync,
    updateProcedure: updateMutation.mutateAsync,
    deleteProcedure: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Buscar um procedimento específico
export function useProcedure(procedureId: string | null) {
  return useQuery({
    queryKey: ["procedure", procedureId],
    queryFn: () => getProcedureByIdAction(procedureId!),
    enabled: !!procedureId,
  });
}
