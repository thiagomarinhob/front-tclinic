export interface Clinic {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;

  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressZipcode?: string;

  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface RegisterClinicRequest {
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;

  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressZipcode?: string;

  adminEmail: string;
  adminFullName: string;
  adminPassword: string;
}
