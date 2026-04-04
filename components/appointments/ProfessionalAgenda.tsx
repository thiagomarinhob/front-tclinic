'use client'

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppointmentsByProfessional } from '@/hooks/useAppointments';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, MapPin, User } from 'lucide-react';
import Link from 'next/link';
import type { Professional } from '@/types';
import { SPECIALTY_LABELS } from '@/types';

interface ProfessionalAgendaProps {
  professionals: Professional[];
}

export function ProfessionalAgenda({ professionals }: ProfessionalAgendaProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeProfessional, setActiveProfessional] = useState(
    professionals[0]?.id || ''
  );

  if (!professionals || professionals.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Nenhum profissional cadastrado
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Seletor de profissional */}
      <Tabs value={activeProfessional} onValueChange={setActiveProfessional}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {professionals.map((professional) => {
            const initials = professional.user.fullName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .substring(0, 2);

            return (
              <TabsTrigger
                key={professional.id}
                value={professional.id}
                className="flex items-center gap-2"
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span>{professional.user.fullName}</span>
                <Badge variant="outline" className="ml-1">
                  {SPECIALTY_LABELS[professional.specialty] || professional.specialty}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {professionals.map((professional) => (
          <TabsContent key={professional.id} value={professional.id}>
            <ProfessionalSchedule
              professionalId={professional.id}
              professional={professional}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

interface ProfessionalScheduleProps {
  professionalId: string;
  professional: Professional;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

function ProfessionalSchedule({
  professionalId,
  professional,
  selectedDate,
  onDateChange,
}: ProfessionalScheduleProps) {
  const startDate = format(startOfWeek(selectedDate), "yyyy-MM-dd'T'00:00:00");
  const endDate = format(endOfWeek(selectedDate), "yyyy-MM-dd'T'23:59:59");

  const { data: appointments, isLoading } = useAppointmentsByProfessional(
    professionalId,
    startDate,
    endDate
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: any }> = {
      AGENDADO: { label: 'Agendado', variant: 'default' },
      CONFIRMADO: { label: 'Confirmado', variant: 'default' },
      EM_ATENDIMENTO: { label: 'Em Atendimento', variant: 'secondary' },
      FINALIZADO: { label: 'Finalizado', variant: 'outline' },
      CANCELADO: { label: 'Cancelado', variant: 'destructive' },
      NAO_COMPARECEU: { label: 'Não Compareceu', variant: 'secondary' },
    };

    const config = variants[status] || variants.AGENDADO;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="grid gap-4 md:grid-cols-[300px,1fr]">
      {/* Calendário */}
      <Card className="p-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onDateChange(date)}
          locale={ptBR}
          className="rounded-md border-0"
        />

        {/* Info do profissional */}
        <div className="mt-4 pt-4 border-t space-y-2">
          <h3 className="font-semibold text-sm">Informações</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <strong>Especialidade:</strong> {SPECIALTY_LABELS[professional.specialty] || professional.specialty}
            </p>
            <p>
              <strong>
                {professional.documentType}: {professional.documentNumber}
              </strong>
            </p>
          </div>
        </div>
      </Card>

      {/* Tabela de agendamentos */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="font-semibold">
            Agenda da Semana -{' '}
            {format(selectedDate, "'Semana de' dd 'de' MMMM", { locale: ptBR })}
          </h3>
          <p className="text-sm text-muted-foreground">
            {appointments?.length || 0} agendamento(s)
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Sala</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : !appointments || appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum agendamento nesta semana
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {format(new Date(appointment.scheduledAt), 'dd/MM/yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(appointment.scheduledAt), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{appointment.patient.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{appointment.durationMinutes} min</TableCell>
                  <TableCell>
                    {appointment.room ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{appointment.room.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/appointments/${appointment.id}`}>Ver</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}