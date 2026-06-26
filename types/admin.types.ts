import type { PaginatedResponse } from "./api.types";
import type { PlanType, TenantStatus, TypeTenant } from "./auth.types";

export type SubscriptionStatus =
  | "PENDING"
  | "ACTIVE"
  | "CANCELED"
  | "PAST_DUE"
  | "TRIALING"
  | "UNPAID";

export interface AdminOwner {
  userId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
}

export interface AdminSubscriptionSummary {
  status: SubscriptionStatus;
  amount?: number;
  currency?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
}

export interface AdminSubscriptionDetail extends AdminSubscriptionSummary {
  id: string;
  canceledAt?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  stripeCheckoutSessionId?: string;
  createdAt?: string;
}

export interface AdminTenantListItem {
  id: string;
  name: string;
  cnpj?: string;
  subdomain?: string;
  type: TypeTenant;
  status: TenantStatus;
  planType: PlanType;
  trialEndsAt?: string;
  createdAt?: string;
  owner?: AdminOwner | null;
  subscription?: AdminSubscriptionSummary | null;
}

export interface AdminTenantDetail extends Omit<AdminTenantListItem, "subscription"> {
  address?: string;
  phone?: string;
  logoObjectKey?: string;
  updatedAt?: string;
  subscription?: AdminSubscriptionDetail | null;
}

export type AdminTenantsPage = PaginatedResponse<AdminTenantListItem>;

export interface AdminListTenantsParams {
  page?: number;
  size?: number;
  status?: TenantStatus;
  planType?: PlanType;
}
