'use server';

import { apiRequest } from './_helpers';
import type {
  LabExamType,
  LabOrder,
  LabOrderItem,
  LabDashboard,
  CreateLabExamTypeRequest,
  UpdateLabExamTypeRequest,
  CreateLabOrderRequest,
  UpdateLabOrderStatusRequest,
  EnterLabResultRequest,
  ValidateLabResultRequest,
  PaginatedResponse,
  ActionResult,
} from '@/types';

// =====================================================
// Exam Types (Catalog)
// =====================================================

export async function getLabExamTypesAction(
  page: number = 0,
  size: number = 50,
  opts?: { search?: string; active?: boolean }
): Promise<ActionResult<PaginatedResponse<LabExamType>>> {
  try {
    const params: Record<string, string | number | boolean> = { page, size };
    if (opts?.search) params.search = opts.search;
    if (opts?.active !== undefined) params.active = opts.active;
    const data = await apiRequest<PaginatedResponse<LabExamType>>('/lab/exam-types', {
      method: 'GET',
      params,
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao listar tipos de exame' };
  }
}

export async function createLabExamTypeAction(
  data: CreateLabExamTypeRequest
): Promise<ActionResult<LabExamType>> {
  try {
    const result = await apiRequest<LabExamType>('/lab/exam-types', { method: 'POST', body: data });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao criar tipo de exame' };
  }
}

export async function updateLabExamTypeAction(
  id: string,
  data: UpdateLabExamTypeRequest
): Promise<ActionResult<LabExamType>> {
  try {
    const result = await apiRequest<LabExamType>(`/lab/exam-types/${id}`, { method: 'PUT', body: data });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao atualizar tipo de exame' };
  }
}

export async function deleteLabExamTypeAction(id: string): Promise<ActionResult<void>> {
  try {
    await apiRequest<void>(`/lab/exam-types/${id}`, { method: 'DELETE' });
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao excluir tipo de exame' };
  }
}

// =====================================================
// Lab Orders
// =====================================================

export async function getLabOrdersAction(
  page: number = 0,
  size: number = 20,
  opts?: { patientId?: string; status?: string; search?: string }
): Promise<ActionResult<PaginatedResponse<LabOrder>>> {
  try {
    const params: Record<string, string | number> = { page, size };
    if (opts?.patientId) params.patientId = opts.patientId;
    if (opts?.status) params.status = opts.status;
    if (opts?.search) params.search = opts.search;
    const data = await apiRequest<PaginatedResponse<LabOrder>>('/lab/orders', { method: 'GET', params });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao listar pedidos' };
  }
}

export async function getLabOrderByIdAction(id: string): Promise<ActionResult<LabOrder>> {
  try {
    const data = await apiRequest<LabOrder>(`/lab/orders/${id}`, { method: 'GET' });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao buscar pedido' };
  }
}

export async function createLabOrderAction(
  data: CreateLabOrderRequest
): Promise<ActionResult<LabOrder>> {
  try {
    const result = await apiRequest<LabOrder>('/lab/orders', { method: 'POST', body: data });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao criar pedido' };
  }
}

export async function updateLabOrderStatusAction(
  id: string,
  data: UpdateLabOrderStatusRequest
): Promise<ActionResult<LabOrder>> {
  try {
    const result = await apiRequest<LabOrder>(`/lab/orders/${id}/status`, { method: 'PATCH', body: data });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao atualizar status' };
  }
}

export async function getLabOrdersByPatientAction(
  patientId: string
): Promise<ActionResult<LabOrder[]>> {
  try {
    const data = await apiRequest<LabOrder[]>(`/lab/patients/${patientId}/orders`, { method: 'GET' });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao buscar histórico' };
  }
}

// =====================================================
// Results
// =====================================================

export async function enterLabResultAction(
  itemId: string,
  data: EnterLabResultRequest
): Promise<ActionResult<LabOrderItem>> {
  try {
    const result = await apiRequest<LabOrderItem>(`/lab/order-items/${itemId}/result`, {
      method: 'POST',
      body: data,
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao lançar resultado' };
  }
}

export async function validateLabResultAction(
  itemId: string,
  data: ValidateLabResultRequest
): Promise<ActionResult<LabOrderItem>> {
  try {
    const result = await apiRequest<LabOrderItem>(`/lab/order-items/${itemId}/validate`, {
      method: 'PATCH',
      body: data,
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao validar resultado' };
  }
}

// =====================================================
// Dashboard
// =====================================================

export async function getLabDashboardAction(): Promise<ActionResult<LabDashboard>> {
  try {
    const data = await apiRequest<LabDashboard>('/lab/dashboard', { method: 'GET' });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao carregar dashboard' };
  }
}
