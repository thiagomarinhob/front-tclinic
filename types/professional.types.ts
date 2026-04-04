import { User } from './auth.types';

export interface Professional {
  id: string;
  user: User;
  specialty: Specialty;
  documentType: DocumentType;
  documentNumber: string;
  documentState?: string;
  bio?: string;
  profileImageUrl?: string;
  isActive: boolean;
}

export enum Specialty {
  CARDIOLOGISTA = 'CARDIOLOGISTA',
  CLINICO_GERAL = 'CLINICO_GERAL',
  DENTISTA = 'DENTISTA',
  DERMATOLOGISTA = 'DERMATOLOGISTA',
  ENDOCRINOLOGISTA = 'ENDOCRINOLOGISTA',
  ENFERMEIRO = 'ENFERMEIRO',
  FISIOTERAPEUTA = 'FISIOTERAPEUTA',
  GASTROENTEROLOGISTA = 'GASTROENTEROLOGISTA',
  GINECOLOGISTA = 'GINECOLOGISTA',
  MASTOLOGISTA = 'MASTOLOGISTA',
  OBSTETRIACO = 'OBSTETRIACO',
  OFTALMOLOGISTA = 'OFTALMOLOGISTA',
  PEDIATRA = 'PEDIATRA',
  PSICOLOGISTA = 'PSICOLOGISTA',
  PSIQUIATRA = 'PSIQUIATRA',
  UROLOGISTA = 'UROLOGISTA',
}

export const SPECIALTY_LABELS: Record<Specialty, string> = {
  [Specialty.CARDIOLOGISTA]: 'Cardiologista',
  [Specialty.CLINICO_GERAL]: 'Clínico Geral',
  [Specialty.DENTISTA]: 'Dentista',
  [Specialty.DERMATOLOGISTA]: 'Dermatologista',
  [Specialty.ENDOCRINOLOGISTA]: 'Endocrinologista',
  [Specialty.ENFERMEIRO]: 'Enfermeiro',
  [Specialty.FISIOTERAPEUTA]: 'Fisioterapeuta',
  [Specialty.GASTROENTEROLOGISTA]: 'Gastroenterologista',
  [Specialty.GINECOLOGISTA]: 'Ginecologista',
  [Specialty.MASTOLOGISTA]: 'Mastologista',
  [Specialty.OBSTETRIACO]: 'Obstétrico',
  [Specialty.OFTALMOLOGISTA]: 'Oftalmologista',
  [Specialty.PEDIATRA]: 'Pediatra',
  [Specialty.PSICOLOGISTA]: 'Psicólogo',
  [Specialty.PSIQUIATRA]: 'Psiquiatra',
  [Specialty.UROLOGISTA]: 'Urologista',
};

export enum DocumentType {
  CRM = 'CRM',
  CREFITO = 'CREFITO',
  CRO = 'CRO',
  CRP = 'CRP',
  CRN = 'CRN',
  COREN = 'COREN',
  OUTRO = 'OUTRO',
}

export interface CreateProfessionalRequest {
  userId: string;
  tenantId?: string;
  specialty: string;
  documentType: DocumentType;
  documentNumber: string;
  documentState?: string;
  bio?: string;
}

export interface CreateProfessionalWithUserRequest {
  // User fields
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  cpf?: string;
  birthDate?: string;
  
  // Professional fields
  specialty: string;
  documentType: DocumentType;
  documentNumber: string;
  documentState?: string;
  bio?: string;
}