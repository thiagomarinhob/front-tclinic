// =====================================================
// Enums
// =====================================================

export type LabOrderStatus =
  | 'REQUESTED'
  | 'COLLECTED'
  | 'RECEIVED'
  | 'IN_ANALYSIS'
  | 'COMPLETED'
  | 'CANCELLED';

export type LabResultStatus =
  | 'PENDING'
  | 'ENTERED'
  | 'TECHNICAL_VALIDATED'
  | 'RELEASED';

export type LabPriority = 'ROUTINE' | 'URGENT';

export type LabPaymentType = 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO' | 'HEALTH_PLAN' | 'PRIVATE';

export type LabSector =
  | 'HEMATOLOGY'
  | 'BIOCHEMISTRY'
  | 'IMMUNOLOGY'
  | 'MICROBIOLOGY'
  | 'URINALYSIS'
  | 'PARASITOLOGY'
  | 'HORMONES'
  | 'COAGULATION'
  | 'OTHER';

export type SampleType =
  | 'BLOOD'
  | 'URINE'
  | 'FECES'
  | 'SWAB'
  | 'SALIVA'
  | 'TISSUE'
  | 'OTHER';

// =====================================================
// Exam Type (Catalog)
// =====================================================

export interface LabExamType {
  id: string;
  tenantId: string;
  code: string | null;
  name: string;
  sector: LabSector;
  sampleType: SampleType | null;
  unit: string | null;
  referenceRangeText: string | null;
  preparationInfo: string | null;
  turnaroundHours: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabExamTypeRequest {
  code?: string;
  name: string;
  sector?: LabSector;
  sampleType?: SampleType;
  unit?: string;
  referenceRangeText?: string;
  preparationInfo?: string;
  turnaroundHours?: number;
}

export interface UpdateLabExamTypeRequest {
  code?: string;
  name: string;
  sector?: LabSector;
  sampleType?: SampleType;
  unit?: string;
  referenceRangeText?: string;
  preparationInfo?: string;
  turnaroundHours?: number;
  active: boolean;
}

// =====================================================
// Lab Order
// =====================================================

export interface LabOrderItem {
  id: string;
  examTypeId: string | null;
  examName: string;
  sector: LabSector;
  sampleType: SampleType | null;
  unit: string | null;
  referenceRangeText: string | null;
  resultValue: string | null;
  resultStatus: LabResultStatus;
  abnormal: boolean | null;
  critical: boolean;
  technicalValidatedBy: string | null;
  technicalValidatedAt: string | null;
  finalValidatedBy: string | null;
  finalValidatedAt: string | null;
  observations: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LabOrder {
  id: string;
  tenantId: string;
  patientId: string;
  patientName: string;
  appointmentId: string | null;
  professionalId: string | null;
  requesterName: string | null;
  priority: LabPriority;
  paymentType: LabPaymentType;
  healthPlanName: string | null;
  clinicalNotes: string | null;
  status: LabOrderStatus;
  sampleCode: string | null;
  collectedAt: string | null;
  collectedBy: string | null;
  receivedAt: string | null;
  items: LabOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabOrderItemRequest {
  examTypeId?: string;
  examName: string;
  sector?: LabSector;
  sampleType?: SampleType;
  unit?: string;
  referenceRangeText?: string;
}

export interface CreateLabOrderRequest {
  patientId: string;
  appointmentId?: string;
  professionalId?: string;
  requesterName?: string;
  priority?: LabPriority;
  paymentType?: LabPaymentType;
  healthPlanId?: string;
  clinicalNotes?: string;
  items: CreateLabOrderItemRequest[];
}

export interface UpdateLabOrderStatusRequest {
  status: LabOrderStatus;
  sampleCode?: string;
  collectedBy?: string;
  collectedAt?: string;
  receivedAt?: string;
}

// =====================================================
// Lab Results
// =====================================================

export interface EnterLabResultRequest {
  resultValue: string;
  abnormal?: boolean;
  critical?: boolean;
  observations?: string;
}

export interface ValidateLabResultRequest {
  validationType: 'TECHNICAL' | 'FINAL';
  validatedBy: string;
}

// =====================================================
// Dashboard
// =====================================================

export interface LabDashboard {
  totalRequested: number;
  totalCollected: number;
  totalInAnalysis: number;
  totalCompleted: number;
  pendingResults: number;
  awaitingValidation: number;
}
