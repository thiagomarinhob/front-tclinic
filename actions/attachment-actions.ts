'use server';

import { apiRequest } from './_helpers';
import type { ActionResult } from '@/types';

export interface AttachmentResponse {
  id: string;
  appointmentId: string;
  fileName: string;
  fileType: string | null;
  fileSizeBytes: number | null;
  createdAt: string;
}

export interface AttachmentUploadUrlResponse {
  uploadUrl: string;
  objectKey: string;
  expiresInMinutes: number;
}

export interface AttachmentViewUrlResponse {
  url: string;
}

export async function getAttachmentUploadUrlAction(
  appointmentId: string,
  fileName?: string
): Promise<ActionResult<AttachmentUploadUrlResponse>> {
  try {
    const params: Record<string, string> = {};
    if (fileName) params.fileName = fileName;
    const response = await apiRequest<AttachmentUploadUrlResponse>(
      `/appointments/${appointmentId}/attachments/upload-url`,
      { method: 'POST', params }
    );
    return { success: true, data: response };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao obter URL de upload',
    };
  }
}

export async function confirmAttachmentUploadAction(
  appointmentId: string,
  objectKey: string,
  fileName: string,
  fileType?: string,
  fileSizeBytes?: number
): Promise<ActionResult<AttachmentResponse>> {
  try {
    const attachment = await apiRequest<AttachmentResponse>(
      '/appointments/attachments/confirm',
      {
        method: 'POST',
        body: { appointmentId, objectKey, fileName, fileType, fileSizeBytes },
      }
    );
    return { success: true, data: attachment };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao confirmar upload',
    };
  }
}

export async function getAttachmentsByAppointmentAction(
  appointmentId: string
): Promise<ActionResult<AttachmentResponse[]>> {
  try {
    const list = await apiRequest<AttachmentResponse[]>(
      `/appointments/${appointmentId}/attachments`,
      { method: 'GET' }
    );
    return { success: true, data: list };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao listar anexos',
    };
  }
}

export async function getAttachmentViewUrlAction(
  attachmentId: string
): Promise<ActionResult<AttachmentViewUrlResponse>> {
  try {
    const response = await apiRequest<AttachmentViewUrlResponse>(
      `/appointments/attachments/${attachmentId}/view-url`,
      { method: 'GET' }
    );
    return { success: true, data: response };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao obter link do anexo',
    };
  }
}

export async function deleteAttachmentAction(
  attachmentId: string
): Promise<ActionResult<void>> {
  try {
    await apiRequest<void>(
      `/appointments/attachments/${attachmentId}`,
      { method: 'DELETE' }
    );
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao remover anexo',
    };
  }
}
