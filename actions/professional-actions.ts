'use server';

import { apiRequest } from './_helpers';
import { getUserByIdAction } from './auth-actions';
import type { 
  Professional,
  CreateProfessionalRequest,
  ActionResult,
  PaginatedResponse,
} from '@/types';
import type { CreateProfessionalWithUserRequest } from '@/types/professional.types';

export async function createProfessionalAction(
  data: CreateProfessionalRequest
): Promise<ActionResult<Professional>> {
  try {
    const professional = await apiRequest<Professional>('/professionals', {
      method: 'POST',
      body: data,
    });

    return {
      success: true,
      data: professional,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar profissional',
    };
  }
}

export async function createProfessionalWithUserAction(
  data: CreateProfessionalWithUserRequest
): Promise<ActionResult<Professional>> {
  try {
    const professional = await apiRequest<Professional>('/professionals/with-user', {
      method: 'POST',
      body: data,
    });

    return {
      success: true,
      data: professional,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar profissional',
    };
  }
}

export async function getProfessionalByIdAction(
  professionalId: string
): Promise<ActionResult<Professional>> {
  try {
    // Como o backend não tem endpoint GET /professionals/{id},
    // precisamos buscar pela lista de profissionais da clínica
    // Obtemos o clinicId do token JWT (agora incluído no backend)
    const { getClinicIdFromToken } = await import('./_helpers');
    const clinicId = await getClinicIdFromToken();
    
    if (!clinicId) {
      return {
        success: false,
        error: 'Clínica não identificada',
      };
    }

    // Buscar todos os profissionais da clínica (sem paginação para encontrar o específico)
    const response = await getProfessionalsByClinicAction(clinicId, 0, 1000);
    
    if (!response.success || !response.data) {
      return {
        success: false,
        error: 'Erro ao buscar profissionais da clínica',
      };
    }

    // Encontrar o profissional pelo ID
    const professional = response.data.content.find(p => p.id === professionalId);

    if (!professional) {
      return {
        success: false,
        error: 'Profissional não encontrado',
      };
    }

    return {
      success: true,
      data: professional,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar profissional',
    };
  }
}

export async function getProfessionalByUserIdAction(
  userId: string
): Promise<ActionResult<Professional>> {
  try {
    const professional = await apiRequest<Professional>(
      `/professionals/user/${userId}`,
      {
        method: 'GET',
      }
    );

    return {
      success: true,
      data: professional,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar profissional',
    };
  }
}

export async function getAllActiveProfessionalsAction(): Promise<ActionResult<Professional[]>> {
  try {
    const professionals = await apiRequest<Professional[]>('/professionals', {
      method: 'GET',
    });

    return {
      success: true,
      data: professionals,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao listar profissionais',
    };
  }
}

export async function getProfessionalsBySpecialtyAction(
  specialty: string
): Promise<ActionResult<Professional[]>> {
  try {
    const professionals = await apiRequest<Professional[]>(
      `/professionals/specialty/${specialty}`,
      {
        method: 'GET',
      }
    );

    return {
      success: true,
      data: professionals,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar profissionais',
    };
  }
}

export async function updateProfessionalAction(
  professionalId: string,
  data: Partial<CreateProfessionalRequest>
): Promise<ActionResult<Professional>> {
  try {
    const professional = await apiRequest<Professional>(
      `/professionals/${professionalId}`,
      {
        method: 'PUT',
        body: data,
      }
    );

    return {
      success: true,
      data: professional,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar profissional',
    };
  }
}

export async function addProfessionalToClinicAction(
  clinicId: string,
  data: CreateProfessionalRequest
): Promise<ActionResult<Professional>> {
  try {
    const professional = await apiRequest<Professional>(
      `/clinics/${clinicId}/professionals`,
      {
        method: 'POST',
        body: data,
      }
    );

    return {
      success: true,
      data: professional,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao adicionar profissional à clínica',
    };
  }
}

export async function getProfessionalsByClinicAction(
  clinicId: string,
  page: number = 0,
  size: number = 20,
  sort: string = 'user.fullName,asc',
  search?: string,
  active?: boolean,
  documentType?: string
): Promise<ActionResult<PaginatedResponse<Professional>>> {
  try {
    if (!clinicId) {
      return {
        success: false,
        error: 'ID da clínica é obrigatório',
      };
    }

    // Preparar parâmetros
    const params: Record<string, string | number | boolean> = {
      page,
      size,
      sort,
    };

    if (search) params.search = search;
    if (active !== undefined) params.active = active;
    if (documentType) params.documentType = documentType;

    // Buscar profissionais paginados do backend
    const response = await apiRequest<PaginatedResponse<{
      id: string;
      userId: string;
      tenantId: string;
      specialty: string;
      documentType: string;
      documentNumber: string;
      documentState?: string;
      bio?: string;
      active: boolean;
      createdAt: string;
      updatedAt: string;
    }>>(
      `/clinics/${clinicId}/professionals`,
      {
        method: 'GET',
        params,
      }
    );

    // Buscar dados completos dos usuários em paralelo apenas para os itens da página atual
    const professionalsWithUsers = await Promise.all(
      (response.content || []).map(async (prof) => {
        const userResult = await getUserByIdAction(prof.userId);
        if (!userResult.success || !userResult.data) {
          return null;
        }

        const user = userResult.data;

        // Montar objeto Professional no formato esperado pelo frontend
        const professional: Professional = {
          id: prof.id,
          user: {
            id: user.id,
            clinicId: user.clinicId || clinicId,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            phone: (user as any).phone,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt || prof.createdAt,
            tenantStatus: user.tenantStatus,
            planType: user.planType,
          },
          specialty: prof.specialty,
          documentType: prof.documentType as any,
          documentNumber: prof.documentNumber,
          documentState: prof.documentState,
          bio: prof.bio,
          isActive: prof.active,
        };

        return professional;
      })
    );

    // Filtrar profissionais nulos
    const validProfessionals = professionalsWithUsers.filter(
      (p): p is Professional => p !== null
    );

    return {
      success: true,
      data: {
        content: validProfessionals,
        totalElements: response.totalElements || 0,
        totalPages: response.totalPages || 0,
        size: response.size || size,
        number: response.number || page,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar profissionais da clínica',
    };
  }
}

export async function updateProfessionalActiveAction(
  professionalId: string,
  active: boolean
): Promise<ActionResult<Professional>> {
  try {
    // Backend retorna ProfessionalResponse (com userId e tenantId, não user completo)
    const response = await apiRequest<{
      id: string;
      userId: string;
      tenantId: string;
      specialty: string;
      documentType: string;
      documentNumber: string;
      documentState?: string;
      bio?: string;
      active: boolean;
      createdAt: string;
      updatedAt: string;
    }>(
      `/professionals/${professionalId}/active`,
      {
        method: 'PATCH',
        body: { active },
      }
    );

    // Buscar dados completos do usuário
    const userResult = await getUserByIdAction(response.userId);
    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: 'Erro ao buscar dados do usuário',
      };
    }

    const user = userResult.data;

    // Montar objeto Professional no formato esperado pelo frontend
    const professional: Professional = {
      id: response.id,
      user: {
        id: user.id,
        clinicId: user.clinicId || response.tenantId,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: (user as any).phone,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt || response.createdAt,
        tenantStatus: user.tenantStatus,
        planType: user.planType,
      },
      specialty: response.specialty,
      documentType: response.documentType as any,
      documentNumber: response.documentNumber,
      documentState: response.documentState,
      bio: response.bio,
      isActive: response.active,
    };

    return {
      success: true,
      data: professional,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar status do profissional',
    };
  }
}