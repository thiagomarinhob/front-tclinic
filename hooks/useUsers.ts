'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUsersByTenantAction,
  updateUserAction,
  deleteUserAction,
  updateUserBlockedAction,
} from '@/actions/user-actions';
import { useAuth } from './useAuth';
import type { UserListItem, UpdateUserBodyRequest, PaginatedResponse } from '@/types';
import { toast } from 'sonner';

export function useUsersByTenant(
  tenantId: string | null,
  page: number = 0,
  size: number = 20,
  sort: string = 'firstName,asc',
  search?: string,
  blocked?: boolean,
  role?: string
) {
  const queryClient = useQueryClient();

  const { data: result, isLoading, error, refetch } = useQuery({
    queryKey: ['users', 'tenant', tenantId, page, size, sort, search, blocked, role],
    queryFn: async () => {
      if (!tenantId) {
        return { success: false, data: { content: [], totalElements: 0, totalPages: 0, size, number: page } };
      }
      return await getUsersByTenantAction(tenantId, page, size, sort, search, blocked, role);
    },
    enabled: !!tenantId,
  });

  const users = result?.success ? result.data?.content || [] : [];
  const pagination = result?.success ? {
    totalElements: result.data?.totalElements || 0,
    totalPages: result.data?.totalPages || 0,
    size: result.data?.size || size,
    number: result.data?.number || page,
  } : null;

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserBodyRequest }) =>
      updateUserAction(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar usuário');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteUserAction(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir usuário');
    },
  });

  // Block/Unblock mutation
  const updateBlockedMutation = useMutation({
    mutationFn: ({ userId, blocked }: { userId: string; blocked: boolean }) =>
      updateUserBlockedAction(userId, blocked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Status do usuário atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar status do usuário');
    },
  });

  return {
    users,
    pagination,
    isLoading,
    error,
    refetch,
    updateUser: updateMutation.mutate,
    deleteUser: deleteMutation.mutate,
    updateUserBlocked: updateBlockedMutation.mutate,
  };
}

export function useUsersByCurrentClinic(
  page: number = 0,
  size: number = 20,
  sort: string = 'firstName,asc',
  search?: string,
  blocked?: boolean
) {
  const { user } = useAuth();
  const clinicId = user?.clinicId || null;
  
  // Filtrar apenas usuários do tipo RECEPTION
  return useUsersByTenant(clinicId, page, size, sort, search, blocked, 'RECEPTION');
}
