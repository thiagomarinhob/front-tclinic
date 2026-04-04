'use server';

import { apiRequest } from './_helpers';
import type { 
  Procedure, 
  CreateProcedureRequest, 
  UpdateProcedureRequest,
  PaginatedResponse,
  ActionResult, 
} from '@/types';

export async function createProcedureAction(
  data: CreateProcedureRequest
): Promise<ActionResult<Procedure>> { 
  try {
    const procedure = await apiRequest<Procedure>('/procedures', {
      method: 'POST',
      body: data,
    });

    return {
      success: true,
      data: procedure,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar procedimento',
    };
  }
}

export async function updateProcedureAction(
  procedureId: string, 
  data: UpdateProcedureRequest
): Promise<ActionResult<Procedure>> { 
  try {
    const isActiveOnly = typeof data.active === 'boolean' 
      && Object.keys(data).length === 1;

    if (isActiveOnly) {
      const procedure = await apiRequest<Procedure>(`/procedures/${procedureId}/active`, {
        method: 'PATCH',
        body: { active: data.active },
      });
      return { success: true, data: procedure };
    }

    const requestData: any = { ...data };
    if (typeof data.active === 'boolean') {
      requestData.active = data.active;
      delete requestData.active;
    }

    const procedure = await apiRequest<Procedure>(`/procedures/${procedureId}`, {
      method: 'PUT',
      body: requestData,
    });

    return {
      success: true,
      data: procedure,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar procedimento',
    };
  }
}

export async function getProcedureByIdAction(
  procedureId: string
): Promise<ActionResult<Procedure>> { 
  try {
    const procedure = await apiRequest<Procedure>(`/procedures/${procedureId}`, {
      method: 'GET',
    });

    return {
      success: true,
      data: procedure,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar procedimento',
    };
  }
}

export async function getAllProceduresAction(
  tenantId: string,
  page: number = 0,
  size: number = 20,
  opts?: { search?: string; active?: boolean | null; professionalId?: string }
): Promise<ActionResult<PaginatedResponse<Procedure>>> {
  try {
    if (!tenantId) {
      return {
        success: false,
        error: 'ID da clínica (tenantId) é obrigatório',
      };
    }

    const params: Record<string, string | number | boolean> = {
      tenantId,
      page,
      size,
      sort: 'name,asc',
    };
    if (opts?.search != null && opts.search.trim().length > 0) {
      params.search = opts.search.trim();
    }
    if (opts?.active !== undefined && opts?.active !== null) {
      params.active = opts.active;
    }
    if (opts?.professionalId) {
      params.professionalId = opts.professionalId;
    }

    const response = await apiRequest<PaginatedResponse<Procedure>>('/procedures', {
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
      error: error instanceof Error ? error.message : 'Erro ao listar procedimentos',
    };
  }
}

export async function deleteProcedureAction(
  procedureId: string
): Promise<ActionResult<void>> { 
  try {
    await apiRequest(`/procedures/${procedureId}`, {
      method: 'DELETE',
    });

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao excluir procedimento',
    };
  }
}
