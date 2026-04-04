import { Patient } from './patient.types';
import { Professional } from './professional.types';
import { Room } from './room.types';
import { PaymentMethod, PaymentStatus } from './financial.types';
import { VitalSigns } from './medical-record.types';

export interface Appointment {
  id: string;
  patient: Patient;
  professional: Professional;
  room?: Room;

  scheduledAt: string;
  durationMinutes: number;
  status: AppointmentStatus;

  observations?: string;
  cancellationReason?: string;

  startedAt?: string;
  finishedAt?: string;
  durationActualMinutes?: number;

  totalValue: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt?: string;

  vitalSigns?: VitalSigns | null;

  procedures: AppointmentProcedure[];
  createdAt: string;
}

export enum AppointmentStatus {
  AGENDADO = 'AGENDADO',
  CONFIRMADO = 'CONFIRMADO',
  EM_ATENDIMENTO = 'EM_ATENDIMENTO',
  FINALIZADO = 'FINALIZADO',
  CANCELADO = 'CANCELADO',
  NAO_COMPARECEU = 'NAO_COMPARECEU',
}

// PaymentMethod and PaymentStatus are imported from financial.types.ts

export interface AppointmentProcedure {
  id: string;
  name: string;
  description?: string;
  value: number;
  quantity: number;
  totalValue: number;
}

/* export interface Room {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  isActive: boolean;
}

export interface CreateRoomRequest {
  name: string;
  description?: string;
  capacity?: number;
} */

export interface CreateAppointmentRequest {
  tenantId: string;
  createdBy: string;
  patientId: string;
  professionalId: string;
  roomId?: string;
  scheduledAt: string;
  durationMinutes?: number;
  observations?: string;
  totalValue: number;
  procedureIds?: string[];
}

export interface UpdateAppointmentRequest {
  patientId?: string;
  professionalId?: string;
  roomId?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  observations?: string;
  procedureIds?: string[];
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
}

export interface FinishAppointmentRequest {
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  observations?: string;
}

