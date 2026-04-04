'use client'

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTodayAppointmentsAction,
  getAppointmentByIdAction,
  getAppointmentsByDateRangeAction,
  getAppointmentsByProfessionalAction,
  getAppointmentsByTenantAction,
  getAppointmentsByPatientAction,
  createAppointmentAction,
  updateAppointmentAction,
  startAppointmentAction,
  finishAppointmentAction,
  cancelAppointmentAction,
} from '@/actions/appointment-actions';
import type { 
  CreateAppointmentRequest, 
  UpdateAppointmentRequest,
  FinishAppointmentRequest 
} from '@/types';
import { toast } from 'sonner';

export function useAppointments() {
  const queryClient = useQueryClient();
  const [pendingConflict, setPendingConflict] = useState<{
    data: any;
    error: string;
    type: 'create' | 'update';
    appointmentId?: string;
  } | null>(null);

  const { data: result, isLoading, refetch } = useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: () => getTodayAppointmentsAction(),
    refetchInterval: 30000,
  });

  const todayAppointments = result?.success ? result.data : [];

  const createMutation = useMutation({
    mutationFn: async ({ data, forceSchedule = false }: { 
      data: CreateAppointmentRequest; 
      forceSchedule?: boolean 
    }) => {
      const result = await createAppointmentAction(data, forceSchedule);
      
      if (!result.success && result.isConflict && !forceSchedule) {
        setPendingConflict({
          data,
          error: result.error || '',
          type: 'create',
        });
        throw new Error('CONFLICT');
      }
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setPendingConflict(null);
      toast.success('Agendamento criado com sucesso!');
    },
    onError: (error: any) => {
      if (error.message !== 'CONFLICT') {
        toast.error(error.message || 'Erro ao criar agendamento');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ 
      appointmentId, 
      data, 
      forceSchedule = false 
    }: { 
      appointmentId: string;
      data: UpdateAppointmentRequest; 
      forceSchedule?: boolean 
    }) => {
      const result = await updateAppointmentAction(appointmentId, data, forceSchedule);
      
      if (!result.success && result.isConflict && !forceSchedule) {
        setPendingConflict({
          data,
          error: result.error || '',
          type: 'update',
          appointmentId,
        });
        throw new Error('CONFLICT');
      }
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setPendingConflict(null);
      toast.success('Agendamento atualizado com sucesso!');
    },
    onError: (error: any) => {
      if (error.message !== 'CONFLICT') {
        toast.error(error.message || 'Erro ao atualizar agendamento');
      }
    },
  });

  const confirmConflict = async () => {
    if (!pendingConflict) return;

    if (pendingConflict.type === 'create') {
      await createMutation.mutateAsync({ 
        data: pendingConflict.data, 
        forceSchedule: true 
      });
    } else if (pendingConflict.type === 'update') {
      await updateMutation.mutateAsync({ 
        appointmentId: pendingConflict.appointmentId!,
        data: pendingConflict.data, 
        forceSchedule: true 
      });
    }
  };

  const cancelConflict = () => {
    setPendingConflict(null);
  };

  return {
    todayAppointments,
    isLoading,
    refetch,
    createAppointment: (data: CreateAppointmentRequest) => 
      createMutation.mutateAsync({ data }),
    updateAppointment: (appointmentId: string, data: UpdateAppointmentRequest) => 
      updateMutation.mutateAsync({ appointmentId, data }),
    confirmConflict,
    cancelConflict,
    pendingConflict,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}

export function useAppointment(appointmentId: string | null) {
  return useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      if (!appointmentId) return null;
      const result = await getAppointmentByIdAction(appointmentId);
      return result.success ? result.data : null;
    },
    enabled: !!appointmentId,
    staleTime: 60_000, 
  });
}

export function useAppointmentsByDateRange(
  tenantId: string | null,
  startDate: string,
  endDate: string
) {
  return useQuery({
    queryKey: ['appointments', 'range', tenantId, startDate, endDate],
    queryFn: async () => {
      if (!tenantId) return [];
      const result = await getAppointmentsByDateRangeAction(tenantId, startDate, endDate);
      return result.success ? result.data : [];
    },
    enabled: !!tenantId && !!startDate && !!endDate,
    refetchInterval: 30_000,
  });
}

export function useAppointmentsByProfessional(
  professionalId: string,
  startDate: string,
  endDate: string
) {
  return useQuery({
    queryKey: ['appointments', 'professional', professionalId, startDate, endDate],
    queryFn: async () => {
      const result = await getAppointmentsByProfessionalAction(
        professionalId,
        startDate,
        endDate
      );
      return result.success ? result.data : [];
    },
    enabled: !!professionalId && !!startDate && !!endDate,
  });
}

export function useAppointmentsByTenant(
  tenantId: string | null,
  date?: string,
  status?: string,
  orderBy: string = 'scheduledAt_desc'
) {
  return useQuery({
    queryKey: ['appointments', 'tenant', tenantId, date, status, orderBy],
    queryFn: async () => {
      if (!tenantId) return [];
      const result = await getAppointmentsByTenantAction(tenantId, date, status, orderBy);
      return result.success ? result.data : [];
    },
    enabled: !!tenantId,
    refetchInterval: 30000,
  });
}

export function useAppointmentsByPatient(patientId: string | null) {
  return useQuery({
    queryKey: ['appointments', 'patient', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const result = await getAppointmentsByPatientAction(patientId, 0, 50);
      if (!result.success) return [];
      const data = result.data;
      return Array.isArray(data) ? data : (data?.content ?? []);
    },
    enabled: !!patientId,
  });
}