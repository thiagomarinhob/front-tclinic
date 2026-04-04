"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  loginAction,
  logoutAction,
  setPasswordAction,
  getCurrentUserAction,
  getUserByIdAction,
  switchTenantAction,
} from "@/actions/auth-actions";
import { ROUTES } from "@/config/constants";
import type { User, UserRole } from "@/types";
import { toast } from "sonner";

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Carregar usuário do token na inicialização
  useEffect(() => {
    async function loadUser() {
      try {
        const result = await getCurrentUserAction();

        if (result.success && result.data?.userId) {
          // Buscar dados completos do usuário
          const userResult = await getUserByIdAction(result.data.userId);

          if (userResult.success && userResult.data) {
            const userData = userResult.data as User;
            setUser(userData);
            setIsAuthenticated(true);

            // Validar status do tenant e redirecionar se necessário
            // Apenas na inicialização, não redireciona imediatamente para evitar loops
            // O redirecionamento após login é feito no método login()
          } else {
            // Se não conseguir buscar dados completos, ainda marca como autenticado
            // mas com dados básicos do token
            setIsAuthenticated(true);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [router]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const result = await loginAction(email, password);

      if (!result.success) {
        toast.error(result.error || "Erro ao fazer login");
        setIsLoading(false);
        return result;
      }

      // Buscar dados completos do usuário após login bem-sucedido
      if (result.data?.user?.id) {
        const userResult = await getUserByIdAction(result.data.user.id);

        if (userResult.success && userResult.data) {
          const userData = userResult.data as User;
          setUser(userData);
          setIsAuthenticated(true);

          // Validar status do tenant e redirecionar conforme os requisitos
          const tenantStatus = userData.tenantStatus;

          if (tenantStatus === "PENDING_SETUP") {
            toast.info("Por favor, escolha um plano para continuar");
            router.push(ROUTES.PLAN_SELECTION);
            return result;
          } else if (tenantStatus === "ACTIVE") {
            toast.success("Login realizado com sucesso!");
            router.push(ROUTES.DASHBOARD);
            return result;
          } else if (tenantStatus === "TRIAL") {
            // TRIAL também pode acessar o dashboard
            toast.success(
              "Login realizado com sucesso! Período de teste ativo.",
            );
            router.push(ROUTES.DASHBOARD);
            return result;
          } else if (tenantStatus === "SUSPENDED") {
            toast.error(
              "Sua conta está suspensa. Entre em contato com o suporte.",
            );
            router.push(ROUTES.PLAN_SELECTION);
            return result;
          } else if (tenantStatus === "CANCELED") {
            toast.error(
              "Sua conta foi cancelada. Entre em contato com o suporte.",
            );
            // Limpar estado local e redirecionar
            setUser(null);
            setIsAuthenticated(false);
            await logoutAction();
            router.push(ROUTES.LOGIN);
            return result;
          } else if (!tenantStatus) {
            // Se não tem status definido, considerar como PENDING_SETUP
            toast.info("Por favor, escolha um plano para continuar");
            router.push(ROUTES.PLAN_SELECTION);
            return result;
          } else {
            // Status desconhecido, tratar como PENDING_SETUP por segurança
            toast.info("Por favor, escolha um plano para continuar");
            router.push(ROUTES.PLAN_SELECTION);
            return result;
          }
        } else if (result.data.user) {
          // Usar dados parciais se não conseguir buscar completos
          const partialUser: User = {
            id: result.data.user.id,
            email: result.data.user.email,
            fullName: result.data.user.fullName,
            role: result.data.user.role as UserRole,
            clinicId: result.data.user.clinicId,
            isActive: true,
            emailVerified: true,
            createdAt: new Date().toISOString(),
          };
          setUser(partialUser);
          setIsAuthenticated(true);
          toast.success("Login realizado com sucesso!");
          router.push(ROUTES.DASHBOARD);
        }
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao fazer login";
      toast.error(errorMessage);
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const definePassword = async (
    token: string,
    password: string,
    confirmPassword: string,
  ) => {
    try {
      setIsLoading(true);
      const result = await setPasswordAction(token, password, confirmPassword);

      if (!result.success) {
        toast.error(result.error || "Erro ao definir senha");
        return result;
      }

      toast.success("Senha definida com sucesso! Você já pode fazer login.");
      router.push(ROUTES.LOGIN);

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao definir senha";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const result = await logoutAction();

      if (!result.success) {
        toast.error("Erro ao fazer logout");
        setIsLoading(false);
        return;
      }

      // Limpar estado do usuário
      setUser(null);
      setIsAuthenticated(false);

      toast.success("Logout realizado com sucesso!");
      router.push(ROUTES.LOGIN);
    } catch {
      toast.error("Erro ao fazer logout");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const result = await getCurrentUserAction();

      if (result.success && result.data?.userId) {
        // Buscar dados completos do usuário
        const userResult = await getUserByIdAction(result.data.userId);

        if (userResult.success && userResult.data) {
          const userData = userResult.data as User;
          setUser(userData);
          setIsAuthenticated(true);
          return { success: true, user: userData };
        }
      }

      return { success: false };
    } catch (error) {
      console.error("Erro ao atualizar dados do usuário:", error);
      return { success: false };
    }
  };

  const switchClinic = async (tenantId: string) => {
    try {
      const result = await switchTenantAction(tenantId);
      if (!result.success) {
        toast.error(result.error || "Erro ao trocar de clínica");
        return { success: false };
      }
      toast.success("Clínica alterada com sucesso");
      const refresh = await refreshUser();
      return refresh;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao trocar de clínica",
      );
      return { success: false };
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    setPassword: definePassword,
    logout,
    refreshUser,
    switchClinic,
  };
}
