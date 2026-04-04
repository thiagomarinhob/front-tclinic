'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ChevronRight, User, Stethoscope, MapPin, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Appointment } from '@/types';
import { SPECIALTY_LABELS } from '@/types';

interface AppointmentListSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointments: Appointment[];
  onSelectAppointment: (appointment: Appointment) => void;
  /** Título customizado (ex: para visualização por dia) */
  title?: string;
  /** Descrição customizada (ex: "5 agendamentos neste dia") */
  description?: string;
  /** Quando vazio: mensagem e callback para novo agendamento */
  emptyState?: {
    message: string;
    onAddNew?: () => void;
  };
}

const statusConfig: Record<string, { label: string; bg: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  AGENDADO: { label: 'Agendado', bg: 'bg-blue-500', variant: 'default' },
  CONFIRMADO: { label: 'Confirmado', bg: 'bg-green-500', variant: 'default' },
  EM_ATENDIMENTO: { label: 'Em Atendimento', bg: 'bg-amber-500', variant: 'secondary' },
  FINALIZADO: { label: 'Finalizado', bg: 'bg-indigo-500', variant: 'outline' },
  CANCELADO: { label: 'Cancelado', bg: 'bg-red-500', variant: 'destructive' },
  NAO_COMPARECEU: { label: 'Não Compareceu', bg: 'bg-gray-500', variant: 'secondary' },
};

export function AppointmentListSheet({
  open,
  onOpenChange,
  appointments,
  onSelectAppointment,
  title: customTitle,
  description: customDescription,
  emptyState,
}: AppointmentListSheetProps) {
  const hasEmptyState = emptyState && appointments.length === 0;
  if (appointments.length === 0 && !hasEmptyState) return null;

  const earliestTime = appointments.length > 0
    ? appointments.reduce((earliest, apt) => {
        const time = new Date(apt.scheduledAt).getTime();
        return time < earliest ? time : earliest;
      }, Infinity)
    : 0;

  const slotTime = format(new Date(earliestTime), 'HH:mm');
  const title = customTitle ?? `Agendamentos - ${slotTime}`;
  const description = customDescription ?? `${appointments.length} agendamento${appointments.length !== 1 ? 's' : ''} neste horário`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {title}
          </SheetTitle>
          <SheetDescription>
            {hasEmptyState ? emptyState!.message : description}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
          {hasEmptyState ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <p className="text-muted-foreground text-center">
                {emptyState!.message}
              </p>
              {emptyState!.onAddNew && (
                <Button onClick={emptyState!.onAddNew} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo agendamento
                </Button>
              )}
            </div>
          ) : (
          <div className="space-y-3">
            {appointments.map((appointment) => {
              const config = statusConfig[appointment.status] || statusConfig.AGENDADO;

              return (
                <button
                  key={appointment.id}
                  onClick={() => onSelectAppointment(appointment)}
                  className="w-full text-left p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-3 w-3 rounded-full mt-1.5 flex-shrink-0 ${config.bg}`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Stethoscope className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-semibold text-sm truncate">
                          {appointment.professional.user.fullName}
                        </span>
                        {appointment.professional.specialty && (
                          <span className="text-xs text-muted-foreground truncate">
                            - {SPECIALTY_LABELS[appointment.professional.specialty] || appointment.professional.specialty}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-muted-foreground truncate">
                          {appointment.patient.fullName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(appointment.scheduledAt), 'HH:mm')} - {appointment.durationMinutes}min
                        </span>
                      </div>

                      {appointment.room?.name && (
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            {appointment.room.name}
                          </span>
                        </div>
                      )}

                      <Badge variant={config.variant} className="text-xs">
                        {config.label}
                      </Badge>
                    </div>

                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
