'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Calendar, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointmentsByPatient } from '@/hooks/useAppointments';
import { AppointmentStatus, Specialty, SPECIALTY_LABELS } from '@/types';
import type { Appointment } from '@/types';

interface RecentHistoryProps {
  patientId: string;
  currentAppointmentId?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  [AppointmentStatus.AGENDADO]: { label: 'Agendado', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800' },
  [AppointmentStatus.CONFIRMADO]: { label: 'Confirmado', className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800' },
  [AppointmentStatus.EM_ATENDIMENTO]: { label: 'Em Atendimento', className: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-800' },
  [AppointmentStatus.FINALIZADO]: { label: 'Finalizado', className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' },
  [AppointmentStatus.CANCELADO]: { label: 'Cancelado', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800' },
  [AppointmentStatus.NAO_COMPARECEU]: { label: 'Não Compareceu', className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800' },
};

export function RecentHistory({ patientId, currentAppointmentId }: RecentHistoryProps) {
  const { data: appointments = [], isLoading } = useAppointmentsByPatient(patientId);

  // Apenas consultas finalizadas (têm prontuário), excluindo a consulta atual
  const past = [...appointments]
    .filter(
      (a: Appointment) =>
        a.status === AppointmentStatus.FINALIZADO &&
        a.id !== currentAppointmentId
    )
    .sort(
      (a: Appointment, b: Appointment) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    );

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Histórico Recente
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-cyan-600" />
                <span className="text-sm font-semibold text-foreground">Consultas anteriores</span>
              </div>
              {!isLoading && (
                <span className="text-xs text-muted-foreground">{past.length}</span>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : past.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                Nenhuma consulta anterior registrada.
              </p>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {past.map((appt: Appointment) => {
                  const specialtyLabel =
                    appt.professional?.specialty
                      ? (SPECIALTY_LABELS[appt.professional.specialty as Specialty] ?? appt.professional.specialty)
                      : null;
                  return (
                    <AccordionItem key={appt.id} value={appt.id}>
                      <AccordionTrigger className="py-3 text-sm hover:no-underline">
                        <div className="text-left">
                          <p className="font-medium">
                            {format(parseISO(appt.scheduledAt), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          {specialtyLabel && (
                            <p className="text-xs text-muted-foreground font-normal">{specialtyLabel}</p>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pb-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(appt.scheduledAt), 'HH:mm')}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${statusConfig[AppointmentStatus.FINALIZADO].className}`}
                            >
                              Finalizado
                            </Badge>
                          </div>

                          {appt.professional?.user?.fullName && (
                            <p className="text-xs text-muted-foreground">
                              {appt.professional.user.fullName}
                            </p>
                          )}

                          {appt.procedures && appt.procedures.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {appt.procedures.map((p) => p.name).join(', ')}
                            </p>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            asChild
                          >
                            <a
                              href={`/appointments/${appt.id}/medical-record`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Visualizar Prontuário
                            </a>
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
