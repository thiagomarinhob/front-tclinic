'use server';

import { apiRequest } from './_helpers';
import type { ActionResult } from '@/types';

export interface MedicalDocument {
  id: string;
  appointmentId: string;
  documentUrl: string;
  documentType: string;
  source: string;
  createdAt: string;
}

export async function generateMemedTokenAction(
  professionalId: string,
  appointmentId: string
): Promise<ActionResult<{ token: string }>> {
  try {
    const response = await apiRequest<{ token: string; error?: string }>(
      '/memed/token',
      {
        method: 'POST',
        body: { professionalId, appointmentId },
      }
    );

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, data: { token: response.token } };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao gerar token do Memed',
    };
  }
}

export async function saveMemedDocumentAction(
  appointmentId: string,
  documentUrl: string,
  documentType: string
): Promise<ActionResult<MedicalDocument>> {
  try {
    const document = await apiRequest<MedicalDocument>('/memed/documents', {
      method: 'POST',
      body: { appointmentId, documentUrl, documentType },
    });

    return { success: true, data: document };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao salvar documento',
    };
  }
}

export async function saveMemedDocumentWithPdfAction(
  appointmentId: string,
  prescriptionId: string,
  userToken: string,
  documentType: string
): Promise<ActionResult<MedicalDocument>> {
  try {
    const document = await apiRequest<MedicalDocument>('/memed/documents/pdf', {
      method: 'POST',
      body: { appointmentId, prescriptionId, userToken, documentType },
    });

    return { success: true, data: document };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao salvar PDF do documento',
    };
  }
}

export async function getMemedDocumentsAction(
  appointmentId: string
): Promise<ActionResult<MedicalDocument[]>> {
  try {
    const documents = await apiRequest<MedicalDocument[]>(
      `/memed/appointments/${appointmentId}/documents`,
      { method: 'GET' }
    );

    return { success: true, data: Array.isArray(documents) ? documents : [] };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao buscar documentos',
    };
  }
}
