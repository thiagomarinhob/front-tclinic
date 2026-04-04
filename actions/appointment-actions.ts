'use server';

import { apiRequest, getClinicIdFromToken } from './_helpers';
import type {
  Appointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  FinishAppointmentRequest,
  ActionResult,
  VitalSigns,
} from '@/types';

export async function createAppointmentAction(
  data: CreateAppointmentRequest,
  forceSchedule: boolean = false
): Promise<ActionResult<Appointment>> {
  try {
    const appointment = await apiRequest<Appointment>('/appointments', {
      method: 'POST',
      body: { ...data, forceSchedule },
    });

    return {
      success: true,
      data: appointment, // ✅ appointment JÁ é Appointment
    };
  } catch (error: any) {
    if (error.status === 409) {
      return {
        success: false,
        isConflict: true,
        error: error.message,
      };
    }

    return {
      success: false,
      isConflict: false,
      error: error.message || 'Erro ao criar agendamento',
    };
  }
}

export async function updateAppointmentAction(
  appointmentId: string,
  data: UpdateAppointmentRequest,
  forceSchedule: boolean = false
): Promise<ActionResult<Appointment>> {
  try {
    const appointment = await apiRequest<Appointment>(
      `/appointments`,
      {
        method: 'PUT',
        body: { id: appointmentId, ...data, forceSchedule },
      }
    );

    return {
      success: true,
      data: appointment,
    };
  } catch (error: any) {
    if (error.status === 409) {
      return {
        success: false,
        isConflict: true,
        error: error.message,
      };
    }

    return {
      success: false,
      isConflict: false,
      error: error.message || 'Erro ao atualizar agendamento',
    };
  }
}

export async function startAppointmentAction(
  appointmentId: string
): Promise<ActionResult<Appointment>> {
  try {
    const appointment = await apiRequest<Appointment>(
      `/appointments/${appointmentId}/start`,
      {
        method: 'POST',
      }
    );

    return {
      success: true,
      data: appointment,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao iniciar atendimento',
    };
  }
}

export async function finishAppointmentAction(
  appointmentId: string,
  data: FinishAppointmentRequest
): Promise<ActionResult<Appointment>> {
  try {
    const appointment = await apiRequest<Appointment>(
      `/appointments/${appointmentId}/finish`,
      {
        method: 'POST',
        body: data,
      }
    );

    return {
      success: true,
      data: appointment,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao finalizar atendimento',
    };
  }
}

export async function cancelAppointmentAction(
  appointmentId: string,
  reason?: string
): Promise<ActionResult<Appointment>> {
  try {
    await apiRequest<void>(
      `/appointments/${appointmentId}`,
      {
        method: 'DELETE',
      }
    );

    return {
      success: true,
      data: undefined as any,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao cancelar agendamento',
    };
  }
}

export async function saveTriageAction(
  appointmentId: string,
  vitalSigns: VitalSigns
): Promise<ActionResult<Appointment>> {
  try {
    const appointment = await apiRequest<Appointment>(
      `/appointments/${appointmentId}/triage`,
      {
        method: 'PATCH',
        body: vitalSigns,
      }
    );

    return {
      success: true,
      data: appointment,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao salvar triagem',
    };
  }
}

export async function getAppointmentByIdAction(
  appointmentId: string
): Promise<ActionResult<Appointment>> {
  try {
    const appt = await apiRequest<AppointmentResponseBackend>(
      `/appointments/${appointmentId}`,
      {
        method: 'GET',
      }
    );

    // Se já tem os dados completos (patient e professional como objetos)
    if ('patient' in appt && typeof (appt as any).patient === 'object') {
      return {
        success: true,
        data: appt as unknown as Appointment,
      };
    }

    // Se não tiver, buscar os dados completos
    const { getPatientByIdAction } = await import('./patient-actions');
    const { getProfessionalByIdAction } = await import('./professional-actions');

    const [patientResult, professionalResult] = await Promise.all([
      getPatientByIdAction(appt.patientId),
      getProfessionalByIdAction(appt.professionalId),
    ]);

    const patient = patientResult.success ? patientResult.data : null;
    const professional = professionalResult.success ? professionalResult.data : null;

    if (!patient || !professional) {
      return {
        success: true,
        data: {
          id: appt.id,
          patient: { id: appt.patientId, fullName: 'Carregando...' } as any,
          professional: { id: appt.professionalId, user: { fullName: 'Carregando...' }, specialty: '' } as any,
          scheduledAt: appt.scheduledAt,
          durationMinutes: appt.durationMinutes,
          status: appt.status as any,
          observations: appt.observations,
          startedAt: appt.startedAt,
          finishedAt: appt.finishedAt,
          durationActualMinutes: appt.durationActualMinutes,
          totalValue: appt.totalValue,
          paymentMethod: appt.paymentMethod as any,
          paymentStatus: appt.paymentStatus as any,
          paidAt: appt.paidAt,
          vitalSigns: appt.vitalSigns ?? null,
          procedures: appt.procedures ?? [],
          createdAt: appt.createdAt,
        } as Appointment,
      };
    }

    return {
      success: true,
      data: {
        id: appt.id,
        patient,
        professional,
        room: appt.roomId ? { id: appt.roomId } as any : undefined,
        scheduledAt: appt.scheduledAt,
        durationMinutes: appt.durationMinutes,
        status: appt.status as any,
        observations: appt.observations,
        startedAt: appt.startedAt,
        finishedAt: appt.finishedAt,
        durationActualMinutes: appt.durationActualMinutes,
        totalValue: appt.totalValue,
        paymentMethod: appt.paymentMethod as any,
        paymentStatus: appt.paymentStatus as any,
        paidAt: appt.paidAt,
        vitalSigns: appt.vitalSigns ?? null,
        procedures: appt.procedures ?? [],
        createdAt: appt.createdAt,
      } as Appointment,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao buscar agendamento',
    };
  }
}

export async function getAppointmentsByDateRangeAction(
  tenantId: string,
  startDate: string,
  endDate: string
): Promise<ActionResult<Appointment[]>> {
  try {
    const raw = await apiRequest<AppointmentResponseBackend[]>(
      `/tenants/${tenantId}/appointments`,
      {
        method: 'GET',
        params: {
          startDate: startDate.slice(0, 10),
          endDate: endDate.slice(0, 10),
          orderBy: 'scheduledAt_asc',
        },
      }
    );
    const appointmentsResponse = Array.isArray(raw) ? raw : [];

    const appointments: Appointment[] = await Promise.all(
      appointmentsResponse.map(async (appt) => {
        if ('patient' in appt && typeof (appt as any).patient === 'object') {
          return appt as unknown as Appointment;
        }
        const { getPatientByIdAction } = await import('./patient-actions');
        const { getProfessionalByIdAction } = await import('./professional-actions');
        const [patientResult, professionalResult] = await Promise.all([
          getPatientByIdAction(appt.patientId),
          getProfessionalByIdAction(appt.professionalId),
        ]);
        const patient = patientResult.success ? patientResult.data : null;
        const professional = professionalResult.success ? professionalResult.data : null;
        if (!patient || !professional) {
          return {
            id: appt.id,
            patient: { id: appt.patientId, fullName: '…' } as any,
            professional: { id: appt.professionalId, user: { fullName: '…' }, specialty: '' } as any,
            scheduledAt: appt.scheduledAt,
            durationMinutes: appt.durationMinutes,
            status: appt.status as any,
            observations: appt.observations,
            startedAt: appt.startedAt,
            finishedAt: appt.finishedAt,
            durationActualMinutes: appt.durationActualMinutes,
            totalValue: appt.totalValue,
            paymentMethod: appt.paymentMethod as any,
            paymentStatus: appt.paymentStatus as any,
            paidAt: appt.paidAt,
            vitalSigns: appt.vitalSigns ?? null,
            procedures: appt.procedures ?? [],
            createdAt: appt.createdAt,
          } as Appointment;
        }
        return {
          id: appt.id,
          patient,
          professional,
          room: appt.roomId ? { id: appt.roomId } as any : undefined,
          scheduledAt: appt.scheduledAt,
          durationMinutes: appt.durationMinutes,
          status: appt.status as any,
          observations: appt.observations,
          startedAt: appt.startedAt,
          finishedAt: appt.finishedAt,
          durationActualMinutes: appt.durationActualMinutes,
          totalValue: appt.totalValue,
          paymentMethod: appt.paymentMethod as any,
          paymentStatus: appt.paymentStatus as any,
          paidAt: appt.paidAt,
          vitalSigns: appt.vitalSigns ?? null,
          procedures: appt.procedures ?? [],
          createdAt: appt.createdAt,
        } as Appointment;
      })
    );

    return { success: true, data: appointments };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao buscar agendamentos',
    };
  }
}

export async function getTodayAppointmentsAction(): Promise<ActionResult<Appointment[]>> {
  try {
    const tenantId = await getClinicIdFromToken();
    if (!tenantId) {
      return { success: false, error: 'Clínica não identificada' };
    }

    const today = new Date().toISOString().slice(0, 10);
    const raw = await apiRequest<AppointmentResponseBackend[]>(
      `/tenants/${tenantId}/appointments`,
      {
        method: 'GET',
        params: {
          date: today,
          orderBy: 'scheduledAt_asc',
        },
      }
    );

    const appointmentsResponse = Array.isArray(raw) ? raw : [];

    const appointments: Appointment[] = await Promise.all(
      appointmentsResponse.map(async (appt) => {
        if ('patient' in appt && typeof (appt as any).patient === 'object') {
          return appt as unknown as Appointment;
        }
        const { getPatientByIdAction } = await import('./patient-actions');
        const { getProfessionalByIdAction } = await import('./professional-actions');
        const [patientResult, professionalResult] = await Promise.all([
          getPatientByIdAction(appt.patientId),
          getProfessionalByIdAction(appt.professionalId),
        ]);
        const patient = patientResult.success ? patientResult.data : null;
        const professional = professionalResult.success ? professionalResult.data : null;
        if (!patient || !professional) {
          return {
            id: appt.id,
            patient: { id: appt.patientId, fullName: '…' } as any,
            professional: { id: appt.professionalId, user: { fullName: '…' }, specialty: '' } as any,
            scheduledAt: appt.scheduledAt,
            durationMinutes: appt.durationMinutes,
            status: appt.status as any,
            observations: appt.observations,
            startedAt: appt.startedAt,
            finishedAt: appt.finishedAt,
            durationActualMinutes: appt.durationActualMinutes,
            totalValue: appt.totalValue,
            paymentMethod: appt.paymentMethod as any,
            paymentStatus: appt.paymentStatus as any,
            paidAt: appt.paidAt,
            vitalSigns: appt.vitalSigns ?? null,
            procedures: appt.procedures ?? [],
            createdAt: appt.createdAt,
          } as Appointment;
        }
        return {
          id: appt.id,
          patient,
          professional,
          room: appt.roomId ? { id: appt.roomId } as any : undefined,
          scheduledAt: appt.scheduledAt,
          durationMinutes: appt.durationMinutes,
          status: appt.status as any,
          observations: appt.observations,
          startedAt: appt.startedAt,
          finishedAt: appt.finishedAt,
          durationActualMinutes: appt.durationActualMinutes,
          totalValue: appt.totalValue,
          paymentMethod: appt.paymentMethod as any,
          paymentStatus: appt.paymentStatus as any,
          paidAt: appt.paidAt,
          vitalSigns: appt.vitalSigns ?? null,
          procedures: appt.procedures ?? [],
          createdAt: appt.createdAt,
        } as Appointment;
      })
    );

    return {
      success: true,
      data: appointments,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao buscar agendamentos de hoje',
    };
  }
}

export async function getAppointmentsByProfessionalAction(
  professionalId: string,
  startDate: string,
  endDate: string
): Promise<ActionResult<Appointment[]>> {
  try {
    const raw = await apiRequest<AppointmentResponseBackend[]>(
      `/professionals/${professionalId}/appointments`,
      {
        method: 'GET',
        params: {
          startDate: startDate.slice(0, 10),
          endDate: endDate.slice(0, 10),
        },
      }
    );

    const appointmentsResponse = Array.isArray(raw) ? raw : [];

    const appointments: Appointment[] = await Promise.all(
      appointmentsResponse.map(async (appt) => {
        if ('patient' in appt && typeof (appt as any).patient === 'object') {
          return appt as unknown as Appointment;
        }
        const { getPatientByIdAction } = await import('./patient-actions');
        const { getProfessionalByIdAction } = await import('./professional-actions');
        const [patientResult, professionalResult] = await Promise.all([
          getPatientByIdAction(appt.patientId),
          getProfessionalByIdAction(appt.professionalId),
        ]);
        const patient = patientResult.success ? patientResult.data : null;
        const professional = professionalResult.success ? professionalResult.data : null;
        if (!patient || !professional) {
          return {
            id: appt.id,
            patient: { id: appt.patientId, fullName: '…' } as any,
            professional: { id: appt.professionalId, user: { fullName: '…' }, specialty: '' } as any,
            scheduledAt: appt.scheduledAt,
            durationMinutes: appt.durationMinutes,
            status: appt.status as any,
            observations: appt.observations,
            startedAt: appt.startedAt,
            finishedAt: appt.finishedAt,
            durationActualMinutes: appt.durationActualMinutes,
            totalValue: appt.totalValue,
            paymentMethod: appt.paymentMethod as any,
            paymentStatus: appt.paymentStatus as any,
            paidAt: appt.paidAt,
            vitalSigns: appt.vitalSigns ?? null,
            procedures: appt.procedures ?? [],
            createdAt: appt.createdAt,
          } as Appointment;
        }
        return {
          id: appt.id,
          patient,
          professional,
          room: appt.roomId ? { id: appt.roomId } as any : undefined,
          scheduledAt: appt.scheduledAt,
          durationMinutes: appt.durationMinutes,
          status: appt.status as any,
          observations: appt.observations,
          startedAt: appt.startedAt,
          finishedAt: appt.finishedAt,
          durationActualMinutes: appt.durationActualMinutes,
          totalValue: appt.totalValue,
          paymentMethod: appt.paymentMethod as any,
          paymentStatus: appt.paymentStatus as any,
          paidAt: appt.paidAt,
          vitalSigns: appt.vitalSigns ?? null,
          procedures: appt.procedures ?? [],
          createdAt: appt.createdAt,
        } as Appointment;
      })
    );

    return { success: true, data: appointments };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao buscar agendamentos do profissional',
    };
  }
}

export async function getAppointmentsByPatientAction(
  patientId: string,
  page: number = 0,
  size: number = 20
): Promise<ActionResult<any>> { // PaginatedResponse<Appointment>
  try {
    const appointments = await apiRequest<any>(
      `/appointments/patient/${patientId}`,
      {
        method: 'GET',
        params: { page, size },
      }
    );

    return {
      success: true,
      data: appointments,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao buscar histórico do paciente',
    };
  }
}

export async function checkAvailabilityAction(
  professionalId: string,
  startTime: string,
  durationMinutes: number,
  appointmentId?: string
): Promise<ActionResult<boolean>> {
  try {
    const params: Record<string, string | number> = {
      professionalId,
      startTime,
      durationMinutes,
    };
    
    // Só adiciona appointmentId se for fornecido
    if (appointmentId) {
      params.appointmentId = appointmentId;
    }

    const isAvailable = await apiRequest<boolean>(
      '/appointments/check-availability',
      {
        method: 'GET',
        params,
      }
    );

    return {
      success: true,
      data: isAvailable,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao verificar disponibilidade',
    };
  }
}

export async function getAvailableSlotsAction(
  professionalId: string,
  date: string,
  durationMinutes: number = 60
): Promise<ActionResult<string[]>> {
  try {
    const slots = await apiRequest<string[]>(
      '/appointments/available-slots',
      {
        method: 'GET',
        params: {
          professionalId,
          date,
          durationMinutes,
        },
      }
    );

    return {
      success: true,
      data: slots,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao buscar horários disponíveis',
    };
  }
}

// Interface para o AppointmentResponse do backend (com apenas IDs)
interface AppointmentResponseBackend {
  id: string;
  tenantId: string;
  patientId: string;
  professionalId: string;
  roomId?: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  observations?: string;
  cancelledAt?: string;
  startedAt?: string;
  finishedAt?: string;
  durationActualMinutes?: number;
  totalValue: number;
  paymentMethod?: string;
  paymentStatus?: string;
  paidAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  vitalSigns?: VitalSigns | null;
  procedures?: Array<{
    id: string;
    name: string;
    description?: string;
    value: number;
    totalValue: number;
  }>;
}

export async function getAppointmentsByTenantAction(
  tenantId: string,
  date?: string,
  status?: string,
  orderBy: string = 'scheduledAt_desc'
): Promise<ActionResult<Appointment[]>> {
  try {
    const params: Record<string, string> = { orderBy };
    
    if (date) {
      params.date = date;
    }
    
    if (status) {
      params.status = status;
    }

    const appointmentsResponse = await apiRequest<AppointmentResponseBackend[]>(
      `/tenants/${tenantId}/appointments`,
      {
        method: 'GET',
        params,
      }
    );

    // Se o backend retornar apenas IDs, precisamos buscar os dados completos
    // Por enquanto, vamos assumir que o backend pode retornar dados completos ou apenas IDs
    // Se retornar apenas IDs, precisaremos fazer o mapeamento
    const appointments: Appointment[] = await Promise.all(
      appointmentsResponse.map(async (appt) => {
        // Verificar se já tem os dados completos (patient e professional como objetos)
        if ('patient' in appt && typeof (appt as any).patient === 'object') {
          return appt as unknown as Appointment;
        }

        // Se não tiver, buscar os dados completos
        const { getPatientByIdAction } = await import('./patient-actions');
        const { getProfessionalByIdAction } = await import('./professional-actions');
        
        const [patientResult, professionalResult] = await Promise.all([
          getPatientByIdAction(appt.patientId),
          getProfessionalByIdAction(appt.professionalId),
        ]);

        const patient = patientResult.success ? patientResult.data : null;
        const professional = professionalResult.success ? professionalResult.data : null;

        if (!patient || !professional) {
          // Se não conseguir buscar, retornar um objeto parcial
          return {
            id: appt.id,
            patient: { id: appt.patientId, fullName: 'Carregando...' } as any,
            professional: { id: appt.professionalId, user: { fullName: 'Carregando...' }, specialty: '' } as any,
            scheduledAt: appt.scheduledAt,
            durationMinutes: appt.durationMinutes,
            status: appt.status as any,
            observations: appt.observations,
            startedAt: appt.startedAt,
            finishedAt: appt.finishedAt,
            durationActualMinutes: appt.durationActualMinutes,
            totalValue: appt.totalValue,
            paymentMethod: appt.paymentMethod as any,
            paymentStatus: appt.paymentStatus as any,
            paidAt: appt.paidAt,
            vitalSigns: appt.vitalSigns ?? null,
            procedures: appt.procedures ?? [],
            createdAt: appt.createdAt,
          } as Appointment;
        }

        return {
          id: appt.id,
          patient,
          professional,
          room: appt.roomId ? { id: appt.roomId } as any : undefined,
          scheduledAt: appt.scheduledAt,
          durationMinutes: appt.durationMinutes,
          status: appt.status as any,
          observations: appt.observations,
          startedAt: appt.startedAt,
          finishedAt: appt.finishedAt,
          durationActualMinutes: appt.durationActualMinutes,
          totalValue: appt.totalValue,
          paymentMethod: appt.paymentMethod as any,
          paymentStatus: appt.paymentStatus as any,
          paidAt: appt.paidAt,
          vitalSigns: appt.vitalSigns ?? null,
          procedures: appt.procedures ?? [],
          createdAt: appt.createdAt,
        } as Appointment;
      })
    );

    return {
      success: true,
      data: appointments,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao buscar agendamentos',
    };
  }
}