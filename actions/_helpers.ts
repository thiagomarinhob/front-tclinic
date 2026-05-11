"use server";

import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.tclinic.com.br/v1";

export interface ApiError {
  message: string;
  status: number;
}

/**
 * Obtém o token de autenticação dos cookies
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value || null;
}

/**
 * Obtém o userId do token JWT
 */
export async function getUserIdFromToken(): Promise<string | null> {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    // Decodifica o JWT (sem verificar assinatura, apenas para ler o payload)
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const base64WithPadding = base64 + padding;

    const jsonPayload = Buffer.from(base64WithPadding, "base64").toString(
      "utf-8",
    );
    const decoded = JSON.parse(jsonPayload);

    // No backend Java, o userId está no campo 'sub' (subject) do JWT
    // Criado com: .withSubject(user.getId().toString())
    return decoded.sub || decoded.userId || null;
  } catch {
    return null;
  }
}

/**
 * Obtém o clinicId do token JWT
 */
export async function getClinicIdFromToken(): Promise<string | null> {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const base64WithPadding = base64 + padding;

    const jsonPayload = Buffer.from(base64WithPadding, "base64").toString(
      "utf-8",
    );
    const decoded = JSON.parse(jsonPayload);

    return decoded.clinicId || null;
  } catch {
    return null;
  }
}

/**
 * Obtém o role do usuário do token JWT
 */
export async function getUserRoleFromToken(): Promise<string | null> {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const base64WithPadding = base64 + padding;

    const jsonPayload = Buffer.from(base64WithPadding, "base64").toString(
      "utf-8",
    );
    const decoded = JSON.parse(jsonPayload);

    return decoded.role || null;
  } catch {
    return null;
  }
}

/**
 * Define o token de autenticação nos cookies
 */
export async function setAuthToken(
  token: string,
  expiresIn: number,
): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  cookieStore.set("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

/**
 * Define o refresh token nos cookies
 */
export async function setRefreshToken(
  token: string,
  expiresIn: number,
): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  cookieStore.set("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

/**
 * Remove os tokens de autenticação dos cookies
 */
export async function removeAuthToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
}

/**
 * Faz uma requisição para a API
 */
export async function apiRequest<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    body?: unknown;
    params?: Record<string, string | number | boolean>;
    requireAuth?: boolean;
  } = {},
): Promise<T> {
  const { method = "GET", body, params, requireAuth = true } = options;

  let url = `${API_BASE_URL}${endpoint}`;

  // Adiciona query params se existirem
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      // Ignorar valores undefined, null ou vazios
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    url += `?${searchParams.toString()}`;
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Adiciona token se necessário
  if (requireAuth) {
    const token = await getAuthToken();
    if (!token) {
      throw new Error(
        "Token de autenticação não encontrado. Faça login novamente.",
      );
    }
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store", // Importante para Server Actions
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token inválido ou expirado - só tratar como sessão expirada se requireAuth for true
      if (requireAuth) {
        await removeAuthToken();
        throw new Error("Sessão expirada. Faça login novamente.");
      }
      // Se requireAuth é false, 401 pode ser erro de validação/credenciais do endpoint
      // Não remover token nem tratar como sessão expirada
    }

    let errorMessage = `Erro na requisição (${response.status})`;
    try {
      const errorData = await response.json();
      // Backend retorna { timestamp, status, error, message, path }
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    const error: ApiError = {
      message: errorMessage,
      status: response.status,
    };
    throw error;
  }

  // Alguns endpoints podem retornar 204 (No Content)
  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return {} as T;
  }

  // Verifica se há conteúdo antes de tentar fazer parse
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const text = await response.text();
    if (text.trim() === "") {
      return {} as T;
    }
    try {
      const parsed = JSON.parse(text);
      // Backend pode retornar diretamente o objeto ou dentro de um wrapper ApiResponse
      // Se houver 'data', retorna apenas o data, senão retorna o objeto completo
      if (parsed && typeof parsed === "object") {
        return parsed.data || parsed;
      }
      return parsed;
    } catch (parseError) {
      // Se falhar ao fazer parse, retorna objeto vazio
      // Não lança erro para não quebrar o fluxo quando requireAuth é false
      console.error("Erro ao fazer parse da resposta:", parseError);
      return {} as T;
    }
  }

  return {} as T;
}
