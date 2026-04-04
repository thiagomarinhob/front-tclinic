'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointmentsByPatient } from '@/hooks/useAppointments';
import { AppointmentStatus, Specialty, SPECIALTY_LABELS } from '@/types';
import type { Appointment } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  [AppointmentStatus.FINALIZADO]:     { label: 'Finalizado',      className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' },
  [AppointmentStatus.CANCELADO]:      { label: 'Cancelado',       className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800' },
  [AppointmentStatus.NAO_COMPARECEU]: { label: 'Não Compareceu',  className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800' },
  [AppointmentStatus.AGENDADO]:       { label: 'Agendado',        className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800' },
  [AppointmentStatus.CONFIRMADO]:     { label: 'Confirmado',      className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800' },
  [AppointmentStatus.EM_ATENDIMENTO]: { label: 'Em Atendimento',  className: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-800' },
};

interface HistoryDialogProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName?: string;
  currentAppointmentId?: string;
}

export function HistoryDialog({
  open,
  onClose,
  patientId,
  patientName,
  currentAppointmentId,
}: HistoryDialogProps) {
  const { data: appointments = [], isLoading } = useAppointmentsByPatient(
    open ? patientId : null
  );

  const past = [...appointments]
    .filter((a: Appointment) => a.id !== currentAppointmentId)
    .sort(
      (a: Appointment, b: Appointment) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Histórico de Consultas
            {patientName && (
              <span className="text-muted-foreground font-normal ml-2 text-base">
                — {patientName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : past.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            Nenhuma consulta anterior registrada.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground -mt-1">
              {past.length} {past.length === 1 ? 'consulta' : 'consultas'} encontrada{past.length === 1 ? '' : 's'}
            </p>
            <ScrollArea className="max-h-[60vh] pr-3">
              <div className="space-y-0">
                {past.map((appt: Appointment, index: number) => {
                  const status = STATUS_CONFIG[appt.status] ?? { label: appt.status, className: '' };
                  const specialtyLabel = appt.professional?.specialty
                    ? (SPECIALTY_LABELS[appt.professional.specialty as Specialty] ?? appt.professional.specialty)
                    : null;
                  const hasMedicalRecord = appt.status === AppointmentStatus.FINALIZADO;

                  return (
                    <div key={appt.id}>
                      {index > 0 && <Separator />}
                      <div className="flex items-center gap-4 py-3">
                        {/* Data e hora */}
                        <div className="w-28 shrink-0">
                          <p className="text-sm font-medium">
                            {format(parseISO(appt.scheduledAt), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(appt.scheduledAt), 'HH:mm')}
                          </p>
                        </div>

                        {/* Profissional */}
                        <div className="flex-1 min-w-0">
                          {appt.professional?.user?.fullName && (
                            <p className="text-sm font-medium truncate">
                              {appt.professional.user.fullName}
                            </p>
                          )}
                          {specialtyLabel && (
                            <p className="text-xs text-muted-foreground">{specialtyLabel}</p>
                          )}
                          {appt.procedures && appt.procedures.length > 0 && (
                            <p className="text-xs text-muted-foreground truncate">
                              {appt.procedures.map((p) => p.name).join(', ')}
                            </p>
                          )}
                        </div>

                        {/* Status */}
                        <Badge variant="outline" className={`text-xs shrink-0 ${status.className}`}>
                          {status.label}
                        </Badge>

                        {/* Ação */}
                        <div className="shrink-0 w-36">
                          {hasMedicalRecord ? (
                            <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                              <a
                                href={`/appointments/${appt.id}/medical-record`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Ver Prontuário
                              </a>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground pl-2">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
