import { UserRole, Gender } from './auth.types';

// CreateUserRequest para o backend (firstName, lastName, email, password, phone?, cpf?, birthDate?, tenantId?)
export interface CreateUserRequestBodyRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  cpf?: string;
  birthDate?: string;
  tenantId?: string;
}

// CreateUserRequest antigo (mantido para compatibilidade se usado em outros lugares)
export interface CreateUserRequest {
  email: string;
  fullName: string;
  role: UserRole;
  cpf?: string;
  phone?: string;
  birthDate?: string;
  gender?: Gender;
}

export interface UpdateUserRequest {
  fullName?: string;
  cpf?: string;
  phone?: string;
  birthDate?: string;
  gender?: Gender;
}

// UserResponse do backend (firstName, lastName separados)
export interface UserListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  cpf?: string;
  birthDate?: string;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserBodyRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  cpf?: string;
  birthDate?: string;
  email?: string;
}

export interface UpdateUserBlockedBodyRequest {
  blocked: boolean;
}

// Tipos para o backend Role enum
export type BackendRole = 'OWNER' | 'ADMIN' | 'RECEPTION' | 'SPECIALIST' | 'FINANCE' | 'READONLY';

// Tipos para TypeTenant do backend
export type TypeTenant = 'CLINIC' | 'SOLO';

// UserDetailResponse retornado pelo backend
export interface UserDetailResponse {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
  tenantRoles?: TenantRoleInfo[];
}

export interface TenantRoleInfo {
  tenantId: string;
  tenantName?: string;
  subdomain?: string;
  tenantType?: TypeTenant;
  tenantStatus?: string;
  planType?: string;
  trialEndsAt?: string;
  tenantActive?: boolean;
  role?: BackendRole;
}
