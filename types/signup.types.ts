export interface SignUpClinicOwnerRequest {
  // User fields (email e senha para acesso)
  email: string;
  password: string;
  
  // Tenant fields
  name: string;
  cnpj: string;
  planType?: string;
  address?: string;
  phone?: string;
  subdomain: string;
}

export interface SignUpSoloRequest {
  // User fields
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  birthDate: string; // Formato: DD/MM/YYYY
  
  // Tenant fields
  name: string;
  cpf: string;
  planType?: string;
  address?: string;
  phone?: string;
  subdomain: string;
}

export interface SignUpResponse {
  userId: string;
  tenantId: string;
  email: string;
  tenantName: string;
  subdomain: string;
}
