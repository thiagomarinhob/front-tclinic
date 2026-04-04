'use server';

import { apiRequest } from './_helpers';
import type { ActionResult } from '@/types';

export interface HealthPlan {
  id: string;
  name: string;
  active: boolean;
}

export async function getHealthPlansAction(): Promise<ActionResult<HealthPlan[]>> {
  try {
    const data = await apiRequest<HealthPlan[]>('/health-plans', { method: 'GET' });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao listar convênios' };
  }
}

export async function createHealthPlanAction(name: string): Promise<ActionResult<HealthPlan>> {
  try {
    const data = await apiRequest<HealthPlan>('/health-plans', { method: 'POST', body: { name } });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao criar convênio' };
  }
}

export async function updateHealthPlanAction(id: string, name: string): Promise<ActionResult<HealthPlan>> {
  try {
    const data = await apiRequest<HealthPlan>(`/health-plans/${id}`, { method: 'PUT', body: { name } });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao atualizar convênio' };
  }
}

export async function toggleHealthPlanActiveAction(id: string): Promise<ActionResult<HealthPlan>> {
  try {
    const data = await apiRequest<HealthPlan>(`/health-plans/${id}/active`, { method: 'PATCH' });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao alterar status do convênio' };
  }
}
