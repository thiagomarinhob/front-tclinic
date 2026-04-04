// ========== Sinais vitais (compatível com JSONB vital_signs) ==========
export interface VitalSigns {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  imc?: number;
}

// ========== Schema do template (campo do formulário) ==========
export interface MedicalRecordTemplateField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'checkbox' | 'radio' | 'mult_checkbox' | 'select' | string;
  placeholder?: string;
  /** Ordem de exibição (1, 2, 3...); permite mover ex.: última pergunta para posição 2. */
  order?: number;
  /** Campo obrigatório no preenchimento do prontuário */
  required?: boolean;
  /** Opções para radio (uma escolha), mult_checkbox (várias) e select (dropdown). Cada item é o label da opção. */
  options?: string[];
}

// ========== Modelo de prontuário (global, da clínica ou do profissional) ==========
export interface MedicalRecordTemplate {
  id: string;
  tenantId: string | null; // null = template global (sistema)
  professionalId: string | null; // null = modelo da clínica (todos); preenchido = exclusivo do profissional
  name: string;
  professionalType: string | null;
  schema: MedicalRecordTemplateField[];
  readOnly: boolean; // true = template padrão do sistema
  active: boolean;
  /** true = modelo pré-selecionado ao abrir novo prontuário (um por tenant) */
  defaultTemplate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicalRecordTemplateRequest {
  tenantId: string;
  /** Se preenchido, modelo exclusivo do profissional; null = modelo da clínica. */
  professionalId?: string | null;
  name: string;
  professionalType?: string;
  schema: MedicalRecordTemplateField[];
}

export interface UpdateMedicalRecordTemplateRequest {
  name?: string;
  professionalType?: string | null;
  schema?: MedicalRecordTemplateField[];
  active?: boolean;
}

// ========== Item da listagem de prontuários ==========
export interface MedicalRecordListItem {
  id: string;
  appointmentId: string;
  patientName: string;
  professionalName: string;
  scheduledAt: string;
  createdAt: string;
  signedAt: string | null;
}

// ========== Prontuário (respostas conforme template) ==========
export interface MedicalRecord {
  id: string;
  appointmentId: string;
  templateId: string;
  patientName?: string | null;
  professionalName?: string | null;
  content: Record<string, unknown>;
  vitalSigns: VitalSigns | null;
  signedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrUpdateMedicalRecordRequest {
  appointmentId: string;
  templateId: string;
  content: Record<string, unknown>;
  vitalSigns?: VitalSigns | null;
}
