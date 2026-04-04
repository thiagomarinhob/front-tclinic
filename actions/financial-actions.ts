'use server';

import { apiRequest } from './_helpers';
import type { 
  FinancialCategory,
  FinancialTransaction,
  FinancialDashboardResponse,
  CreateFinancialCategoryRequest,
  CreateFinancialTransactionRequest,
  ActionResult,
  TransactionType,
  PaymentStatus,
} from '@/types';

export async function createFinancialCategoryAction(
  data: CreateFinancialCategoryRequest
): Promise<ActionResult<FinancialCategory>> {
  try {
    const category = await apiRequest<FinancialCategory>('/financial/categories', {
      method: 'POST',
      body: data,
    });

    return {
      success: true,
      data: category,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao criar categoria financeira',
    };
  }
}

export async function getFinancialCategoriesByTenantAction(
  tenantId: string,
  type?: TransactionType,
  active?: boolean
): Promise<ActionResult<FinancialCategory[]>> {
  try {
    const params: Record<string, string> = {};
    if (type) params.type = type;
    if (active !== undefined) params.active = String(active);

    const categories = await apiRequest<FinancialCategory[]>(
      `/tenants/${tenantId}/financial/categories`,
      {
        method: 'GET',
        params,
      }
    );

    return {
      success: true,
      data: Array.isArray(categories) ? categories : [],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao buscar categorias financeiras',
    };
  }
}

export async function createFinancialTransactionAction(
  data: CreateFinancialTransactionRequest
): Promise<ActionResult<FinancialTransaction>> {
  try {
    const transaction = await apiRequest<FinancialTransaction>('/financial/transactions', {
      method: 'POST',
      body: data,
    });

    return {
      success: true,
      data: transaction,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao criar transação financeira',
    };
  }
}

export async function getFinancialTransactionsByTenantAction(
  tenantId: string,
  type?: TransactionType,
  status?: PaymentStatus,
  startDate?: string,
  endDate?: string
): Promise<ActionResult<FinancialTransaction[]>> {
  try {
    const params: Record<string, string> = {};
    if (type) params.type = type;
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const transactions = await apiRequest<FinancialTransaction[]>(
      `/tenants/${tenantId}/financial/transactions`,
      {
        method: 'GET',
        params,
      }
    );

    return {
      success: true,
      data: Array.isArray(transactions) ? transactions : [],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao buscar transações financeiras',
    };
  }
}

export async function getFinancialDashboardAction(
  tenantId: string,
  startDate?: string,
  endDate?: string
): Promise<ActionResult<FinancialDashboardResponse>> {
  try {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const dashboard = await apiRequest<FinancialDashboardResponse>(
      `/tenants/${tenantId}/financial/dashboard`,
      {
        method: 'GET',
        params,
      }
    );

    return {
      success: true,
      data: dashboard,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao buscar dados do dashboard financeiro',
    };
  }
}
