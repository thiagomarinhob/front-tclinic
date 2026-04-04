'use server';

import { apiRequest } from './_helpers';
import type { ActionResult } from '@/types';
import type {
  ProfessionalSchedule,
  CreateProfessionalScheduleRequest,
} from '@/types/professional-schedule.types';

export async function createProfessionalScheduleAction(
  data: CreateProfessionalScheduleRequest
): Promise<ActionResult<ProfessionalSchedule>> {
  try {
    const schedule = await apiRequest<ProfessionalSchedule>('/professional-schedules', {
      method: 'POST',
      body: data,
    });

    return {
      success: true,
      data: schedule,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar horário',
    };
  }
}

export async function deleteProfessionalScheduleAction(
  id: string
): Promise<ActionResult<void>> {
  try {
    await apiRequest<void>(`/professional-schedules/${id}`, {
      method: 'DELETE',
    });

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao deletar horário',
    };
  }
}

export async function getProfessionalScheduleByIdAction(
  id: string
): Promise<ActionResult<ProfessionalSchedule>> {
  try {
    const schedule = await apiRequest<ProfessionalSchedule>(`/professional-schedules/${id}`, {
      method: 'GET',
    });

    return {
      success: true,
      data: schedule,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar horário',
    };
  }
}

export async function getProfessionalSchedulesByProfessionalIdAction(
  professionalId: string
): Promise<ActionResult<ProfessionalSchedule[]>> {
  try {
    const schedules = await apiRequest<ProfessionalSchedule[]>(
      `/professionals/${professionalId}/schedules`,
      {
        method: 'GET',
      }
    );

    return {
      success: true,
      data: schedules,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar horários',
    };
  }
}
