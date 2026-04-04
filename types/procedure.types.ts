export interface Procedure {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  estimatedDurationMinutes: number;
  basePrice: number;
  professionalCommissionPercent?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  professionalId?: string;
}

export interface CreateProcedureRequest {
  tenantId: string;
  name: string;
  description?: string;
  estimatedDurationMinutes: number;
  basePrice: number;
  professionalCommissionPercent?: number;
  professionalId?: string;
}

export type UpdateProcedureRequest = Partial<CreateProcedureRequest> & {
  active?: boolean;
};
