"use server";

import {
  setAuthToken,
  setRefreshToken,
  removeAuthToken,
  apiRequest,
  getUserIdFromToken,
  getClinicIdFromToken,
  getUserRoleFromToken,
} from "./_helpers";
import { API_ROUTES } from "@/config/constants";
import type { AuthResponse, UserRole, UserTenantRole } from "@/types";
import { UserRole as UserRoleEnum } from "@/types";

interface LoginResult {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      fullName: string;
      role: string;
      clinicId: string;
    };
  };
  error?: string;
}

/**
 * Realiza o login do usuário e salva o token nos cookies
 * Endpoint: POST /v1/auth/sign-in
 * Retorna: { access_token: string, expires_in: number } (expires_in em milliseconds)
 */
export async function loginAction(
  email: string,
  password: string,
): Promise<LoginResult> {
  try {
    if (!email || !password) {
      return {
        success: false,
        error: "Email e senha são obrigatórios",
      };
    }

    // Backend retorna: { access_token: string, expires_in: number }
    // expires_in vem em milliseconds (epochMilli)
    const authResponse = await apiRequest<{
      access_token: string;
      expires_in: number;
    }>(API_ROUTES.AUTH.SIGN_IN, {
      method: "POST",
      body: { email, password },
      requireAuth: false,
    });

    if (!authResponse.access_token) {
      return {
        success: false,
        error: "Token não recebido do servidor",
      };
    }

    // expires_in vem em milliseconds do backend, converter para segundos
    // expires_in do backend é timestamp (epochMilli), calcular diferença em segundos
    const now = Date.now();
    const expiresAt = authResponse.expires_in;
    const expiresInSeconds = Math.max(1, Math.floor((expiresAt - now) / 1000));

    // Salva o token nos cookies
    await setAuthToken(authResponse.access_token, expiresInSeconds);

    // Obter userId do token JWT (está no campo 'sub')
    const userId = await getUserIdFromToken();

    if (!userId) {
      return {
        success: false,
        error: "Não foi possível obter ID do usuário do token",
      };
    }

    // Retornar apenas o userId - os dados completos serão buscados no hook useAuth
    return {
      success: true,
      data: {
        user: {
          id: userId,
          email: email,
          fullName: "",
          role: "",
          clinicId: "",
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao fazer login",
    };
  }
}

/**
 * Define senha inicial do usuário
 */
export async function setPasswordAction(
  token: string,
  password: string,
  confirmPassword: string,
) {
  try {
    if (!token || !password || !confirmPassword) {
      return {
        success: false,
        error: "Todos os campos são obrigatórios",
      };
    }

    if (password !== confirmPassword) {
      return {
        success: false,
        error: "As senhas não conferem",
      };
    }

    await apiRequest("/users/set-password", {
      method: "POST",
      body: { token, password, confirmPassword },
      requireAuth: false,
    });

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao definir senha",
    };
  }
}

/**
 * Realiza o logout removendo o token dos cookies
 */
export async function logoutAction() {
  try {
    await removeAuthToken();
    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao fazer logout",
    };
  }
}

/**
 * Obtém o ID do usuário atual do token
 */
export async function getCurrentUserIdAction() {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return {
        success: false,
        error: "Usuário não autenticado",
      };
    }
    return {
      success: true,
      data: userId,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao obter ID do usuário",
    };
  }
}

/**
 * Obtém informações básicas do usuário atual do token
 * O token JWT do backend Java contém apenas o userId no campo 'sub'
 * clinicId e role precisam ser buscados via endpoint /users/{id}
 */
export async function getCurrentUserAction() {
  try {
    const userId = await getUserIdFromToken();

    if (!userId) {
      return {
        success: false,
        error: "Usuário não autenticado",
      };
    }

    // O token JWT do backend não inclui clinicId nem role
    // Esses dados devem ser buscados via getUserByIdAction
    return {
      success: true,
      data: {
        userId,
        clinicId: "", // Será preenchido ao buscar dados completos
        role: "", // Será preenchido ao buscar dados completos
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao obter dados do usuário",
    };
  }
}

/**
 * Busca os dados completos do usuário pelo ID
 * Endpoint: GET /v1/users/{id}
 * Retorna: UserDetailResponse com firstName, lastName, email, tenantRoles[]
 */
interface UserDetailResponse {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
  tenantRoles?: Array<{
    tenantId: string;
    tenantName?: string;
    subdomain?: string;
    tenantType?: string;
    tenantStatus?: string;
    planType?: string;
    trialEndsAt?: string;
    tenantActive?: boolean;
    role?: string | { name?: string; value?: string };
  }>;
}

export async function getUserByIdAction(userId: string) {
  try {
    if (!userId) {
      return {
        success: false,
        error: "ID do usuário é obrigatório",
      };
    }

    const userData = await apiRequest<UserDetailResponse>(`/users/${userId}`, {
      method: "GET",
      requireAuth: true,
    });

    // Usar clinicId do token (contexto atual) para escolher o tenant ativo; senão primeiro ativo ou primeiro
    const clinicIdFromToken = await getClinicIdFromToken();
    const activeTenantRole =
      userData.tenantRoles?.find((tr) => tr.tenantId === clinicIdFromToken) ||
      userData.tenantRoles?.find((tr) => tr.tenantActive) ||
      userData.tenantRoles?.[0];

    // Extrair role - backend retorna enum Role (OWNER, ADMIN, RECEPTION, SPECIALIST, FINANCE, READONLY)
    // que será serializado como string no JSON
    let roleValue = "";
    if (activeTenantRole?.role) {
      if (typeof activeTenantRole.role === "string") {
        roleValue = activeTenantRole.role;
      } else if (
        typeof activeTenantRole.role === "object" &&
        activeTenantRole.role !== null
      ) {
        // Se vier como objeto enum serializado
        roleValue =
          (activeTenantRole.role as any).name ||
          (activeTenantRole.role as any).value ||
          String(activeTenantRole.role);
      }
    }

    // Mapear roles do backend para o formato do frontend se necessário
    // Backend: OWNER, ADMIN, RECEPTION, SPECIALIST, FINANCE, READONLY
    // Frontend: ADMIN_CLINIC, PROFISSIONAL_SAUDE, RECEPCIONISTA
    const roleMapping: Record<string, string> = {
      OWNER: "ADMIN_CLINIC",
      ADMIN: "ADMIN_CLINIC",
      RECEPTION: "RECEPCIONISTA",
      SPECIALIST: "PROFISSIONAL_SAUDE",
    };
    roleValue = roleMapping[roleValue] || roleValue;

    const fullName =
      `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
      userData.email;

    // Converter createdAt se vier em formato LocalDateTime
    let createdAtStr = userData.createdAt || new Date().toISOString();
    if (
      createdAtStr &&
      !createdAtStr.includes("T") &&
      !createdAtStr.includes("Z")
    ) {
      // Se vier no formato do Java LocalDateTime, converter
      createdAtStr = new Date(createdAtStr).toISOString();
    }

    // Garantir que roleValue seja um valor válido do enum UserRole do frontend
    let finalRole: UserRole = UserRoleEnum.RECEPCIONISTA; // Default
    if (
      roleValue === UserRoleEnum.ADMIN_CLINIC ||
      roleValue === "ADMIN_CLINIC"
    ) {
      finalRole = UserRoleEnum.ADMIN_CLINIC;
    } else if (
      roleValue === UserRoleEnum.PROFISSIONAL_SAUDE ||
      roleValue === "PROFISSIONAL_SAUDE"
    ) {
      finalRole = UserRoleEnum.PROFISSIONAL_SAUDE;
    } else if (
      roleValue === UserRoleEnum.RECEPCIONISTA ||
      roleValue === "RECEPCIONISTA"
    ) {
      finalRole = UserRoleEnum.RECEPCIONISTA;
    } else if (roleValue === "OWNER" || roleValue === "ADMIN") {
      finalRole = UserRoleEnum.ADMIN_CLINIC;
    } else if (roleValue === "SPECIALIST") {
      finalRole = UserRoleEnum.PROFISSIONAL_SAUDE;
    } else if (roleValue === "RECEPTION") {
      finalRole = UserRoleEnum.RECEPCIONISTA;
    }

    // Mapear tenantRoles para o frontend (seletor de troca de clínica)
    const mapRole = (
      r: string | { name?: string; value?: string } | undefined,
    ): UserRole => {
      let v = "";
      if (typeof r === "string") v = r;
      else if (r && typeof r === "object")
        v = (r as any).name || (r as any).value || "";
      const mapped = roleMapping[v] || v;
      if (mapped === "ADMIN_CLINIC") return UserRoleEnum.ADMIN_CLINIC;
      if (mapped === "PROFISSIONAL_SAUDE")
        return UserRoleEnum.PROFISSIONAL_SAUDE;
      return UserRoleEnum.RECEPCIONISTA;
    };
    const tenantRoles: UserTenantRole[] = (userData.tenantRoles ?? []).map(
      (tr) => ({
        tenantId: tr.tenantId,
        tenantName: tr.tenantName ?? "",
        subdomain: tr.subdomain,
        tenantType: tr.tenantType as any,
        tenantStatus: tr.tenantStatus as any,
        planType: tr.planType as any,
        tenantActive: tr.tenantActive ?? true,
        role: mapRole(tr.role),
      }),
    );

    const user = {
      id: userData.id || userId,
      email: userData.email || "",
      fullName: fullName,
      role: finalRole,
      clinicId: activeTenantRole?.tenantId || "",
      isActive: activeTenantRole?.tenantActive ?? true,
      emailVerified: true,
      createdAt: createdAtStr,
      tenantType: activeTenantRole?.tenantType as any,
      tenantStatus: activeTenantRole?.tenantStatus as any,
      planType: activeTenantRole?.planType as any,
      trialEndsAt: activeTenantRole?.trialEndsAt,
      tenantRoles,
    };

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao buscar dados do usuário",
    };
  }
}

/**
 * Troca o contexto da sessão para outra clínica.
 * Requer que o usuário tenha vínculo com o tenantId. Retorna novo JWT e atualiza o cookie.
 */
export async function switchTenantAction(
  tenantId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!tenantId) {
      return { success: false, error: "ID da clínica é obrigatório" };
    }
    const authResponse = await apiRequest<{
      access_token: string;
      expires_in: number;
    }>(API_ROUTES.AUTH.SWITCH_TENANT, {
      method: "POST",
      body: { tenantId },
      requireAuth: true,
    });
    if (!authResponse?.access_token) {
      return { success: false, error: "Token não recebido" };
    }
    const now = Date.now();
    const expiresAt = authResponse.expires_in;
    const expiresInSeconds = Math.max(1, Math.floor((expiresAt - now) / 1000));
    await setAuthToken(authResponse.access_token, expiresInSeconds);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao trocar de clínica",
    };
  }
}

/**
 * Verifica se o usuário está autenticado
 */
export async function isAuthenticatedAction() {
  try {
    const userId = await getUserIdFromToken();
    return {
      success: true,
      data: !!userId,
    };
  } catch {
    return {
      success: true,
      data: false,
    };
  }
}

/**
 * Atualiza o plano do tenant
 * Endpoint: PATCH /v1/tenants/{tenantId}/plan
 * Body: { planType: 'BASIC' | 'PRO' | 'CUSTOM' }
 */
export async function updateTenantPlanAction(
  tenantId: string,
  planType: string,
) {
  try {
    if (!tenantId) {
      return {
        success: false,
        error: "ID do tenant é obrigatório",
      };
    }

    if (!planType || !["BASIC", "PRO", "CUSTOM"].includes(planType)) {
      return {
        success: false,
        error: "Tipo de plano inválido",
      };
    }

    const response = await apiRequest<any>(
      API_ROUTES.TENANTS.UPDATE_PLAN(tenantId),
      {
        method: "PATCH",
        body: { planType },
        requireAuth: true,
      },
    );

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao atualizar plano do tenant",
    };
  }
}

export async function createCheckoutSessionAction(
  tenantId: string,
  planType: string,
) {
  try {
    if (!tenantId) {
      return {
        success: false,
        error: "ID do tenant é obrigatório",
      };
    }

    if (!planType || !["BASIC", "PRO"].includes(planType)) {
      return {
        success: false,
        error:
          "Tipo de plano inválido. Apenas BASIC e PRO podem ser pagos via checkout.",
      };
    }

    const response = await apiRequest<{
      checkoutUrl: string;
      sessionId: string;
    }>(API_ROUTES.TENANTS.CREATE_CHECKOUT(tenantId), {
      method: "POST",
      body: { planType },
      requireAuth: true,
    });

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao criar sessão de checkout",
    };
  }
}

/**
 * Inicia período de teste grátis
 * Endpoint: POST /v1/tenants/{tenantId}/trial
 */
export async function startTrialAction(tenantId: string) {
  try {
    if (!tenantId) {
      return {
        success: false,
        error: "ID do tenant é obrigatório",
      };
    }

    const response = await apiRequest<any>(
      API_ROUTES.TENANTS.START_TRIAL(tenantId),
      {
        method: "POST",
        requireAuth: true,
      },
    );

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao iniciar período de teste",
    };
  }
}
