'use server';

import { apiRequest, getClinicIdFromToken } from './_helpers';
import type {
  Room,
  CreateRoomRequest,
  UpdateRoomRequest,
  PaginatedResponse,
  ActionResult,
} from '@/types';

export async function createRoomAction(
  data: Omit<CreateRoomRequest, 'tenantId'>
): Promise<ActionResult<Room>> {
  try {
    const tenantId = await getClinicIdFromToken();

    if (!tenantId) {
      return {
        success: false,
        error: 'ID da clínica não encontrado. Faça login novamente.',
      };
    }

    const room = await apiRequest<Room>('/rooms', {
      method: 'POST',
      body: {
        ...data,
        tenantId,
      },
    });

    return {
      success: true,
      data: room,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar sala',
    };
  }
}

export async function updateRoomAction(
  roomId: string,
  data: UpdateRoomRequest
): Promise<ActionResult<Room>> {
  try {
    const room = await apiRequest<Room>(`/rooms/${roomId}`, {
      method: 'PUT',
      body: data,
    });

    return {
      success: true,
      data: room,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar sala',
    };
  }
}

export async function getRoomByIdAction(
  roomId: string
): Promise<ActionResult<Room>> {
  try {
    const room = await apiRequest<Room>(`/rooms/${roomId}`, {
      method: 'GET',
    });

    return {
      success: true,
      data: room,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar sala',
    };
  }
}

export async function getRoomsPaginatedAction(
  tenantId: string,
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc',
  active?: boolean
): Promise<ActionResult<PaginatedResponse<Room>>> {
  try {
    if (!tenantId) {
      return {
        success: false,
        error: 'ID da clínica (tenantId) é obrigatório',
      };
    }

    const params: Record<string, string | number | boolean> = { tenantId, page, size, sort };
    if (active !== undefined) params.active = active;

    const response = await apiRequest<PaginatedResponse<Room>>('/rooms', {
      method: 'GET',
      params,
    });

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao listar salas',
    };
  }
}

export async function getAllActiveRoomsAction(): Promise<ActionResult<Room[]>> {
  try {
    const tenantId = await getClinicIdFromToken();

    if (!tenantId) {
      return {
        success: false,
        error: 'ID da clínica não encontrado. Faça login novamente.',
      };
    }

    const rooms = await apiRequest<Room[]>('/rooms/all', {
      method: 'GET',
      params: { tenantId, activeOnly: true },
    });

    return {
      success: true,
      data: rooms,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao listar salas',
    };
  }
}

export async function getRoomsByTenantAction(
  tenantId: string,
  activeOnly: boolean = true
): Promise<ActionResult<Room[]>> {
  try {
    if (!tenantId) {
      return {
        success: false,
        error: 'ID da clínica (tenantId) é obrigatório',
      };
    }

    const rooms = await apiRequest<Room[]>('/rooms/all', {
      method: 'GET',
      params: { tenantId, activeOnly },
    });

    return {
      success: true,
      data: rooms,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao listar salas',
    };
  }
}

export async function deleteRoomAction(roomId: string): Promise<ActionResult<void>> {
  try {
    await apiRequest(`/rooms/${roomId}`, {
      method: 'DELETE',
    });

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao excluir sala',
    };
  }
}