'use server';

import { apiRequest } from './_helpers';
import type { ActionResult } from '@/types';

export interface ReminderSettings {
  confirmationWindowMinutes: number;
}

export async function getReminderSettingsAction(): Promise<ActionResult<ReminderSettings>> {
  try {
    const data = await apiRequest<ReminderSettings>('/tenants/me', { method: 'GET' });
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar configuração de lembrete',
    };
  }
}

export async function updateConfirmationWindowAction(
  confirmationWindowMinutes: number
): Promise<ActionResult<void>> {
  try {
    await apiRequest<void>('/tenants/me/confirmation-window', {
      method: 'PATCH',
      body: { confirmationWindowMinutes },
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar configuração de lembrete',
    };
  }
}
