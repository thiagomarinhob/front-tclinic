import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/constants';
import type { Appointment } from '@/types';

interface TodayAppointmentsProps {
  appointments: Appointment[];
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' }> = {
  AGENDADO: { label: 'Agendado', variant: 'default' },
  EM_ATENDIMENTO: { label: 'Em Atendimento', variant: 'warning' },
  FINALIZADO: { label: 'Finalizado', variant: 'success' },
  CANCELADO: { label: 'Cancelado', variant: 'secondary' },
};

export function TodayAppointments({ appointments }: TodayAppointmentsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Agendamentos de Hoje
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href={ROUTES.APPOINTMENTS}>Ver todos</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum agendamento para hoje
            </p>
          ) : (
            appointments.map((appointment) => {
              const time = new Date(appointment.scheduledAt).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const config = STATUS_CONFIG[appointment.status] ?? STATUS_CONFIG.AGENDADO;
              return (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{time}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{appointment.patient.fullName}</span>
                      <span className="text-xs text-muted-foreground">
                        {appointment.professional.user.fullName}
                      </span>
                    </div>
                  </div>
                  <Badge variant={config.variant as any}>{config.label}</Badge>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
