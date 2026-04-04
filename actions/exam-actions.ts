'use server';

import { apiRequest } from './_helpers';
import type {
  Exam,
  CreateExamRequest,
  PresignedUploadUrlResponse,
  ExamResultViewUrlResponse,
  PaginatedResponse,
  ActionResult,
} from '@/types';

export interface ExamTypeItem {
  id: string;
  category: string;
  name: string;
}

export async function getExamTypesAction(): Promise<ActionResult<ExamTypeItem[]>> {
  try {
    const data = await apiRequest<ExamTypeItem[]>('/exam-types', { method: 'GET' });
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao listar tipos de exame',
    };
  }
}

export async function getExamsByTenantAction(
  page: number = 0,
  size: number = 20,
  opts?: { patientId?: string; status?: string }
): Promise<ActionResult<PaginatedResponse<Exam>>> {
  try {
    const params: Record<string, string | number> = { page, size };
    if (opts?.patientId) params.patientId = opts.patientId;
    if (opts?.status) params.status = opts.status;

    const response = await apiRequest<PaginatedResponse<Exam>>('/exams/all', {
      method: 'GET',
      params,
    });
    return { success: true, data: response };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao listar exames',
    };
  }
}

export async function getExamByIdAction(examId: string): Promise<ActionResult<Exam>> {
  try {
    const exam = await apiRequest<Exam>(`/exams/${examId}`, { method: 'GET' });
    return { success: true, data: exam };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar exame',
    };
  }
}

export async function createExamAction(
  data: CreateExamRequest
): Promise<ActionResult<Exam>> {
  try {
    const exam = await apiRequest<Exam>('/exams', {
      method: 'POST',
      body: data,
    });
    return { success: true, data: exam };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar exame',
    };
  }
}

export async function getPresignedUploadUrlAction(
  examId: string,
  fileName?: string
): Promise<ActionResult<PresignedUploadUrlResponse>> {
  try {
    const params: Record<string, string> = {};
    if (fileName) params.fileName = fileName;
    const response = await apiRequest<PresignedUploadUrlResponse>(
      `/exams/${examId}/upload-url`,
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

export async function confirmExamResultUploadAction(
  examId: string,
  objectKey: string
): Promise<ActionResult<Exam>> {
  try {
    const exam = await apiRequest<Exam>('/exams/confirm-result', {
      method: 'POST',
      body: { examId, objectKey },
    });
    return { success: true, data: exam };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao confirmar upload',
    };
  }
}

export async function getExamResultViewUrlAction(
  examId: string
): Promise<ActionResult<ExamResultViewUrlResponse>> {
  try {
    const response = await apiRequest<ExamResultViewUrlResponse>(
      `/exams/${examId}/result-view-url`,
      { method: 'GET' }
    );
    return { success: true, data: response };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao obter link do resultado',
    };
  }
}

export async function getPresignedRequestUploadUrlAction(
  examId: string,
  fileName?: string
): Promise<ActionResult<PresignedUploadUrlResponse>> {
  try {
    const params: Record<string, string> = {};
    if (fileName) params.fileName = fileName;
    const response = await apiRequest<PresignedUploadUrlResponse>(
      `/exams/${examId}/request-upload-url`,
      { method: 'POST', params }
    );
    return { success: true, data: response };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao obter URL de upload da solicitação',
    };
  }
}

export async function confirmExamRequestUploadAction(
  examId: string,
  objectKey: string
): Promise<ActionResult<Exam>> {
  try {
    const exam = await apiRequest<Exam>('/exams/confirm-request', {
      method: 'POST',
      body: { examId, objectKey },
    });
    return { success: true, data: exam };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao confirmar upload da solicitação',
    };
  }
}

export async function getExamRequestViewUrlAction(
  examId: string
): Promise<ActionResult<ExamResultViewUrlResponse>> {
  try {
    const response = await apiRequest<ExamResultViewUrlResponse>(
      `/exams/${examId}/request-view-url`,
      { method: 'GET' }
    );
    return { success: true, data: response };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao obter link da solicitação',
    };
  }
}
