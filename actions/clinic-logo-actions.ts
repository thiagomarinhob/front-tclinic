'use server';

import { apiRequest } from './_helpers';
import type { ActionResult } from '@/types';

export interface LogoUploadUrlResponse {
  uploadUrl: string;
  objectKey: string;
  expiresInMinutes: number;
}

export interface TenantInfo {
  id: string;
  name: string;
  logoObjectKey: string | null;
}

export async function getTenantInfoAction(): Promise<ActionResult<TenantInfo>> {
  try {
    const data = await apiRequest<TenantInfo>('/tenants/me', { method: 'GET' });
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar dados da clínica',
    };
  }
}

export async function getLogoUploadUrlAction(
  fileName: string
): Promise<ActionResult<LogoUploadUrlResponse>> {
  try {
    const data = await apiRequest<LogoUploadUrlResponse>('/tenants/me/logo/upload-url', {
      method: 'POST',
      params: { fileName },
    });
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao gerar URL de upload',
    };
  }
}

export async function confirmLogoUploadAction(
  objectKey: string
): Promise<ActionResult<void>> {
  try {
    await apiRequest<void>('/tenants/me/logo', {
      method: 'PATCH',
      body: { objectKey },
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao salvar logo',
    };
  }
}
