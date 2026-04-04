'use server';

import { apiRequest } from './_helpers';
import type { 
  User,
  CreateUserRequest,
  CreateUserRequestBodyRequest,
  UserRole,
  ActionResult,
  PaginatedResponse,
  UserListItem,
  UpdateUserBodyRequest,
  UpdateUserBlockedBodyRequest,
  UserDetailResponse,
} from '@/types';

export async function createUserAction(
  data: CreateUserRequestBodyRequest
): Promise<ActionResult<User>> {
  try {
    const user = await apiRequest<User>('/users', {
      method: 'POST',
      body: data,
    });

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar usuário',
    };
  }
}

export async function getUsersByRoleAction(
  role: UserRole
): Promise<ActionResult<User[]>> {
  try {
    const users = await apiRequest<User[]>(`/users/role/${role}`, {
      method: 'GET',
    });

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar usuários',
    };
  }
}

export async function getProfessionalsAction(): Promise<ActionResult<User[]>> {
  try {
    const users = await apiRequest<User[]>('/users/professionals', {
      method: 'GET',
    });

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar profissionais',
    };
  }
}

export async function getReceptionistsAction(): Promise<ActionResult<User[]>> {
  try {
    const users = await apiRequest<User[]>('/users/receptionists', {
      method: 'GET',
    });

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar recepcionistas',
    };
  }
}

export async function getUsersByTenantAction(
  tenantId: string,
  page: number = 0,
  size: number = 20,
  sort: string = 'firstName,asc',
  search?: string,
  blocked?: boolean,
  role?: string
): Promise<ActionResult<PaginatedResponse<UserListItem>>> {
  try {
    if (!tenantId) {
      return {
        success: false,
        error: 'ID da clínica é obrigatório',
      };
    }

    // Preparar parâmetros
    const params: Record<string, string | number | boolean> = {
      tenantId,
      page,
      size,
      sort,
    };

    if (search) params.search = search;
    if (blocked !== undefined) params.blocked = blocked;
    if (role) params.role = role;

    // Buscar usuários paginados do backend
    const response = await apiRequest<PaginatedResponse<UserListItem>>(
      '/users',
      {
        method: 'GET',
        params,
      }
    );

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar usuários',
    };
  }
}

export async function updateUserAction(
  userId: string,
  data: UpdateUserBodyRequest
): Promise<ActionResult<UserListItem>> {
  try {
    const user = await apiRequest<UserListItem>(`/users/${userId}`, {
      method: 'PUT',
      body: data,
    });

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar usuário',
    };
  }
}

export async function deleteUserAction(
  userId: string
): Promise<ActionResult<void>> {
  try {
    await apiRequest(`/users/${userId}`, {
      method: 'DELETE',
    });

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao deletar usuário',
    };
  }
}

export async function updateUserBlockedAction(
  userId: string,
  blocked: boolean
): Promise<ActionResult<UserListItem>> {
  try {
    const user = await apiRequest<UserListItem>(`/users/${userId}/blocked`, {
      method: 'PATCH',
      body: { blocked },
    });

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar status de bloqueio',
    };
  }
}

export async function getUserDetailAction(
  userId: string
): Promise<ActionResult<UserDetailResponse>> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'ID do usuário é obrigatório',
      };
    }

    const userDetail = await apiRequest<UserDetailResponse>(`/users/${userId}`, {
      method: 'GET',
    });

    return {
      success: true,
      data: userDetail,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar detalhes do usuário',
    };
  }
}

// Action para associar usuário a tenant
// Endpoint: POST /v1/tenants/{tenantId}/users/{userId}/roles/{role}
export async function associateUserToTenantAction(
  userId: string,
  tenantId: string,
  role: 'OWNER' | 'ADMIN' | 'RECEPTION' | 'SPECIALIST' | 'FINANCE' | 'READONLY' = 'RECEPTION'
): Promise<ActionResult<void>> {
  try {
    if (!userId || !tenantId) {
      return {
        success: false,
        error: 'ID do usuário e da clínica são obrigatórios',
      };
    }

    if (!role) {
      return {
        success: false,
        error: 'Papel (role) é obrigatório',
      };
    }

    // Associar usuário ao tenant através do endpoint
    await apiRequest(`/tenants/${tenantId}/users/${userId}/roles/${role}`, {
      method: 'POST',
    });

    return {
      success: true,
    };
  } catch (error) {
    // Tratar erros específicos da API
    let errorMessage = 'Erro ao associar usuário à clínica';
    
    if (error instanceof Error) {
      // Se a mensagem de erro contém informações úteis, usar ela
      if (error.message.includes('já está associado')) {
        errorMessage = 'Usuário já está associado à clínica com este papel';
      } else if (error.message.includes('não encontrado')) {
        errorMessage = error.message;
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Action para verificar se um CPF já está cadastrado
export async function checkCpfExistsAction(
  cpf: string
): Promise<ActionResult<{ exists: boolean }>> {
  try {
    if (!cpf || cpf.trim().length !== 11) {
      return {
        success: false,
        error: 'CPF inválido',
      };
    }

    const response = await apiRequest<{ exists: boolean }>(`/users/check-cpf/${cpf}`, {
      method: 'GET',
    });

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao verificar CPF',
    };
  }
}