export type ExamStatus = 'REQUESTED' | 'PENDING_RESULT' | 'COMPLETED';

export interface Exam {
  id: string;
  tenantId: string;
  patientId: string;
  appointmentId: string | null;
  name: string;
  clinicalIndication: string | null;
  status: ExamStatus;
  resultFileKey: string | null;
  requestFileKey: string | null;
  createdAt: string;
  updatedAt: string;
  /** Preenchido na listagem (exams/all) */
  patientFirstName?: string;
}

export interface CreateExamRequest {
  patientId: string;
  appointmentId?: string | null;
  name: string;
  clinicalIndication?: string | null;
}

export interface PresignedUploadUrlResponse {
  uploadUrl: string;
  objectKey: string;
  expiresInMinutes: number;
}

export interface ExamResultViewUrlResponse {
  url: string;
}
