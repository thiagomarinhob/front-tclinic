'use server';

import { apiRequest } from './_helpers';
import type { 
  Clinic,
  RegisterClinicRequest,
  ActionResult,
} from '@/types';

export async function registerClinicAction(
  data: RegisterClinicRequest
): Promise<ActionResult<Clinic>> {
  try {
    const clinic = await apiRequest<Clinic>('/clinics/register', {
      method: 'POST',
      body: data,
      requireAuth: false,
    });

    return {
      success: true,
      data: clinic,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao registrar clínica',
    };
  }
}

export async function getCurrentClinicAction(): Promise<ActionResult<Clinic>> {
  try {
    const clinic = await apiRequest<Clinic>('/clinics/me', {
      method: 'GET',
    });

    return {
      success: true,
      data: clinic,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar dados da clínica',
    };
  }
}