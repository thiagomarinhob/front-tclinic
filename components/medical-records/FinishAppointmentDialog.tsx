'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2 } from 'lucide-react';
import { PaymentStatus, PaymentMethod } from '@/types/financial.types';
import type { Appointment } from '@/types/appointment.types';
import type { VitalSigns } from '@/types';
import { FinishAppointmentFlow } from './FinishAppointmentFlow';

export interface FinishAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (paymentStatus: PaymentStatus, paymentMethod?: PaymentMethod) => void;
  isPending: boolean;
  /** Atendimento (obrigatório para o novo fluxo em steps) */
  appointment: Appointment | null | undefined;
  /** Conteúdo atual do prontuário para exibir no resumo */
  medicalRecordContent?: Record<string, unknown>;
  /** Sinais vitais para exibir no resumo */
  vitalSigns?: VitalSigns | null;
}

export function FinishAppointmentDialog({
  open,
  onClose,
  onConfirm,
  isPending,
  appointment,
  medicalRecordContent,
  vitalSigns,
}: FinishAppointmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Finalizar Atendimento
          </DialogTitle>
        </DialogHeader>

        {appointment ? (
          <FinishAppointmentFlow
            appointment={appointment}
            medicalRecordContent={medicalRecordContent}
            vitalSigns={vitalSigns}
            onConfirm={onConfirm}
            onCancel={onClose}
            isPending={isPending}
          />
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Carregando dados do atendimento...
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
