import { Gender } from './auth.types';

export interface Patient {
  id: string;
  fullName: string;
  cpf?: string;
  rg?: string;
  birthDate?: string;
  gender?: Gender;
  email?: string;
  phone?: string;
  whatsapp?: string;
  
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressZipcode?: string;
  
  bloodType?: string;
  allergies?: string;
  healthPlan?: string;

  guardianName?: string;
  guardianPhone?: string;
  guardianRelationship?: string;
  
  isActive: boolean;
  createdAt: string;
}

export interface CreatePatientRequest {
  tenantId: string;
  fullName: string;
  cpf?: string;
  rg?: string;
  birthDate?: string;
  gender?: Gender;
  email?: string;
  phone?: string;
  whatsapp?: string;

  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressZipcode?: string;

  bloodType?: string;
  allergies?: string;
  healthPlan?: string;

  guardianName?: string;
  guardianPhone?: string;
  guardianRelationship?: string;
}

export type UpdatePatientRequest = Partial<CreatePatientRequest> & {
  isActive?: boolean;
};