'use server';

import { apiRequest, getClinicIdFromToken } from './_helpers';
import type { Notification, ActionResult } from '@/types';

export async function getNotificationsAction(
  tenantId: string,
  page: number = 0,
  size: number = 20
): Promise<ActionResult<Notification[]>> {
  try {
    if (!tenantId) {
      return {
        success: false,
        error: 'ID da clínica é obrigatório',
      };
    }

    const notifications = await apiRequest<Notification[]>(
      `/tenants/${tenantId}/notifications`,
      {
        method: 'GET',
        params: { page, size },
      }
    );

    return {
      success: true,
      data: Array.isArray(notifications) ? notifications : [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar notificações',
    };
  }
}

export async function getUnreadCountAction(
  tenantId?: string
): Promise<ActionResult<number>> {
  try {
    const clinicId = tenantId ?? (await getClinicIdFromToken());
    if (!clinicId) {
      return { success: true, data: 0 };
    }

    const count = await apiRequest<number>(
      `/tenants/${clinicId}/notifications/unread-count`,
      { method: 'GET' }
    );

    return {
      success: true,
      data: typeof count === 'number' ? count : 0,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao contar notificações',
    };
  }
}

export async function markNotificationAsReadAction(
  tenantId: string,
  notificationId: string
): Promise<ActionResult<void>> {
  try {
    if (!tenantId || !notificationId) {
      return {
        success: false,
        error: 'tenantId e notificationId são obrigatórios',
      };
    }

    await apiRequest(`/tenants/${tenantId}/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao marcar notificação como lida',
    };
  }
}

export async function markAllNotificationsAsReadAction(
  tenantId?: string
): Promise<ActionResult<void>> {
  try {
    const clinicId = tenantId ?? (await getClinicIdFromToken());
    if (!clinicId) {
      return {
        success: false,
        error: 'ID da clínica não encontrado. Faça login novamente.',
      };
    }

    await apiRequest(`/tenants/${clinicId}/notifications/mark-all-read`, {
      method: 'PATCH',
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao marcar todas como lidas',
    };
  }
}
