'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFinancialCategoriesByTenantAction,
  getFinancialTransactionsByTenantAction,
  getFinancialDashboardAction,
  createFinancialCategoryAction,
  createFinancialTransactionAction,
} from '@/actions/financial-actions';
import type { 
  CreateFinancialCategoryRequest,
  CreateFinancialTransactionRequest,
  TransactionType,
  PaymentStatus,
} from '@/types';
import { toast } from 'sonner';

export function useFinancialCategories(
  tenantId: string | null,
  type?: TransactionType,
  active?: boolean
) {
  return useQuery({
    queryKey: ['financial-categories', tenantId, type, active],
    queryFn: async () => {
      if (!tenantId) return [];
      const result = await getFinancialCategoriesByTenantAction(tenantId, type, active);
      return result.success ? result.data : [];
    },
    enabled: !!tenantId,
  });
}

export function useFinancialTransactions(
  tenantId: string | null,
  type?: TransactionType,
  status?: PaymentStatus,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ['financial-transactions', tenantId, type, status, startDate, endDate],
    queryFn: async () => {
      if (!tenantId) return [];
      const result = await getFinancialTransactionsByTenantAction(
        tenantId,
        type,
        status,
        startDate,
        endDate
      );
      return result.success ? result.data : [];
    },
    enabled: !!tenantId,
  });
}

export function useFinancialDashboard(
  tenantId: string | null,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ['financial-dashboard', tenantId, startDate, endDate],
    queryFn: async () => {
      if (!tenantId) return null;
      const result = await getFinancialDashboardAction(tenantId, startDate, endDate);
      return result.success ? result.data : null;
    },
    enabled: !!tenantId,
    refetchInterval: 60000, // Atualiza a cada minuto
  });
}

export function useCreateFinancialCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFinancialCategoryRequest) => {
      const result = await createFinancialCategoryAction(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: async () => {
      // Invalidar todas as queries de categorias (com diferentes filtros)
      await queryClient.invalidateQueries({ 
        queryKey: ['financial-categories'],
        exact: false 
      });
      toast.success('Categoria criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar categoria');
    },
  });
}

export function useCreateFinancialTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFinancialTransactionRequest) => {
      const result = await createFinancialTransactionAction(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['financial-dashboard'], exact: false });
      toast.success('Transação criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar transação');
    },
  });
}
