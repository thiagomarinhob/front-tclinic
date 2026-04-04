'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllActiveProfessionalsAction,
  getProfessionalByIdAction,
  createProfessionalAction,
  getProfessionalsByClinicAction,
} from '@/actions/professional-actions';
import type { CreateProfessionalRequest } from '@/types';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export function useProfessionals() {
  const queryClient = useQueryClient();

  const { data: result, isLoading, error, refetch } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => getAllActiveProfessionalsAction(),
  });

  const professionals = result?.success ? result.data : [];

  const createMutation = useMutation({
    mutationFn: (data: CreateProfessionalRequest) => createProfessionalAction(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['professionals'] });
        toast.success('Perfil profissional criado com sucesso!');
      } else {
        toast.error(result.error || 'Erro ao criar perfil profissional');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar perfil profissional');
    },
  });

  return {
    professionals,
    isLoading,
    error,
    refetch,
    createProfessional: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useProfessional(professionalId: string | null) {
  return useQuery({
    queryKey: ['professional', professionalId],
    queryFn: async () => {
      if (!professionalId) return null;
      const result = await getProfessionalByIdAction(professionalId);
      return result.success ? result.data : null;
    },
    enabled: !!professionalId,
  });
}

export function useProfessionalsByClinic(
  clinicId: string | null,
  page: number = 0,
  size: number = 20,
  sort: string = 'user.fullName,asc',
  search?: string,
  active?: boolean,
  documentType?: string
) {
  const queryClient = useQueryClient();

  const { data: result, isLoading, error, refetch } = useQuery({
    queryKey: ['professionals', 'clinic', clinicId, page, size, sort, search, active, documentType],
    queryFn: async () => {
      if (!clinicId) return { success: false, data: { content: [], totalElements: 0, totalPages: 0, size, number: page } };
      return await getProfessionalsByClinicAction(clinicId, page, size, sort, search, active, documentType);
    },
    enabled: !!clinicId,
  });

  const professionals = result?.success ? result.data?.content || [] : [];
  const pagination = result?.success ? {
    totalElements: result.data?.totalElements || 0,
    totalPages: result.data?.totalPages || 0,
    size: result.data?.size || size,
    number: result.data?.number || page,
  } : null;

  return {
    professionals,
    pagination,
    isLoading,
    error,
    refetch,
  };
}

export function useProfessionalsByCurrentClinic(
  page: number = 0,
  size: number = 20,
  sort: string = 'user.fullName,asc',
  search?: string,
  active?: boolean,
  documentType?: string
) {
  const { user } = useAuth();
  const clinicId = user?.clinicId || null;
  
  return useProfessionalsByClinic(clinicId, page, size, sort, search, active, documentType);
}