'use server';

import { apiRequest } from './_helpers';
import type {
  MedicalRecordTemplate,
  CreateMedicalRecordTemplateRequest,
  UpdateMedicalRecordTemplateRequest,
  MedicalRecordTemplateField,
  ActionResult,
} from '@/types';

/** Garante que schema seja sempre um array JSON para a API (backend espera JsonNode). */
function ensureSchemaArray(
  schema: MedicalRecordTemplateField[] | unknown
): MedicalRecordTemplateField[] {
  if (Array.isArray(schema)) return schema;
  if (schema != null && typeof schema === 'object' && !Array.isArray(schema)) {
    return [schema as MedicalRecordTemplateField];
  }
  return [];
}

/**
 * Lista modelos de prontuário disponíveis (globais + da clínica + do profissional quando professionalId informado).
 */
export async function getMedicalRecordTemplatesAction(
  tenantId: string,
  activeOnly: boolean = true,
  professionalType?: string,
  professionalId?: string | null
): Promise<ActionResult<MedicalRecordTemplate[]>> {
  try {
    const params: Record<string, string | boolean> = {
      tenantId,
      activeOnly: String(activeOnly),
    };
    if (professionalType) params.professionalType = professionalType;
    // Incluir modelos do profissional no atendimento (globais + clínica + "meu"); obrigatório para listar modelos "Meu"
    const professionalIdStr = professionalId != null && String(professionalId).trim() !== '' ? String(professionalId).trim() : undefined;
    if (professionalIdStr) params.professionalId = professionalIdStr;

    const list = await apiRequest<MedicalRecordTemplate[]>(
      '/medical-record-templates',
      { method: 'GET', params }
    );
    return {
      success: true,
      data: Array.isArray(list) ? list : [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar modelos de prontuário',
    };
  }
}

/**
 * Busca um modelo de prontuário por ID (visível se global ou do tenant).
 */
export async function getMedicalRecordTemplateByIdAction(
  id: string
): Promise<ActionResult<MedicalRecordTemplate>> {
  try {
    const template = await apiRequest<MedicalRecordTemplate>(
      `/medical-record-templates/${id}`,
      { method: 'GET' }
    );
    return { success: true, data: template };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar modelo',
    };
  }
}

/**
 * Cria um novo modelo de prontuário (da clínica ou do profissional, conforme professionalId).
 * Garante que schema seja sempre enviado como array para a API (backend espera JsonNode).
 */
export async function createMedicalRecordTemplateAction(
  body: CreateMedicalRecordTemplateRequest
): Promise<ActionResult<MedicalRecordTemplate>> {
  try {
    const payload: CreateMedicalRecordTemplateRequest = {
      ...body,
      schema: ensureSchemaArray(body.schema),
    };
    const template = await apiRequest<MedicalRecordTemplate>(
      '/medical-record-templates',
      { method: 'POST', body: payload }
    );
    return { success: true, data: template };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar modelo',
    };
  }
}

/**
 * Atualiza um modelo de prontuário (apenas modelos da clínica ou do profissional; não globais).
 * Garante que schema, quando enviado, seja sempre um array para a API (backend espera JsonNode).
 */
export async function updateMedicalRecordTemplateAction(
  id: string,
  body: UpdateMedicalRecordTemplateRequest
): Promise<ActionResult<MedicalRecordTemplate>> {
  try {
    const payload: UpdateMedicalRecordTemplateRequest = {
      ...body,
      ...(body.schema !== undefined && { schema: ensureSchemaArray(body.schema) }),
    };
    const template = await apiRequest<MedicalRecordTemplate>(
      `/medical-record-templates/${id}`,
      { method: 'PUT', body: payload }
    );
    return { success: true, data: template };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar modelo',
    };
  }
}

/**
 * Define um modelo de prontuário como padrão do tenant (pré-selecionado ao abrir novo prontuário).
 */
export async function setMedicalRecordTemplateAsDefaultAction(
  id: string
): Promise<ActionResult<MedicalRecordTemplate>> {
  try {
    const template = await apiRequest<MedicalRecordTemplate>(
      `/medical-record-templates/${id}/set-default`,
      { method: 'POST' }
    );
    return { success: true, data: template };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao definir modelo padrão',
    };
  }
}

/**
 * Remove um modelo de prontuário (apenas modelos da clínica ou do profissional; não globais).
 */
export async function deleteMedicalRecordTemplateAction(
  id: string
): Promise<ActionResult<void>> {
  try {
    await apiRequest<void>(`/medical-record-templates/${id}`, { method: 'DELETE' });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao excluir modelo',
    };
  }
}
