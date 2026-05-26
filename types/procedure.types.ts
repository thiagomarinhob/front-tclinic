export interface ProcedureComboItem {
  id: string;
  procedureId: string;
  name: string;
  estimatedDurationMinutes: number;
  basePrice: number;
}

export interface Procedure {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  estimatedDurationMinutes: number;
  basePrice: number;
  professionalCommissionPercent?: number;
  active: boolean;
  isCombo?: boolean;
  comboItems?: ProcedureComboItem[];
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

export interface CreateComboProcedureRequest {
  name: string;
  description?: string;
  basePrice: number;
  professionalId?: string;
  itemProcedureIds: string[];
}

export type UpdateProcedureRequest = Partial<CreateProcedureRequest> & {
  active?: boolean;
};
