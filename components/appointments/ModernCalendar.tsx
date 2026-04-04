'use client'

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppointmentsByDateRange, useAppointmentsByProfessional } from '@/hooks/useAppointments';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isSameDay,
  isToday,
  startOfDay,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users } from 'lucide-react';
import type { Appointment } from '@/types';
import { AppointmentSheet } from './AppointmentSheet';
import { AppointmentDetailsSheet } from './AppointmentDetailsSheet';
import { AppointmentListSheet } from './AppointmentListSheet';

// ✅ CORES MAIS VIBRANTES E VIVAS
const statusConfig: Record<string, { label: string; bg: string; border: string }> = {
  AGENDADO: { 
    label: 'Agendado', 
    bg: 'bg-blue-500', 
    border: 'border-blue-600'
  },
  CONFIRMADO: { 
    label: 'Confirmado', 
    bg: 'bg-green-500', 
    border: 'border-green-600'
  },
  EM_ATENDIMENTO: { 
    label: 'Em Atendimento', 
    bg: 'bg-amber-500', 
    border: 'border-amber-600'
  },
  FINALIZADO: { 
    label: 'Finalizado', 
    bg: 'bg-indigo-500', 
    border: 'border-indigo-600'
  },
  CANCELADO: { 
    label: 'Cancelado', 
    bg: 'bg-red-500', 
    border: 'border-red-600'
  },
  NAO_COMPARECEU: { 
    label: 'Não Compareceu', 
    bg: 'bg-gray-500', 
    border: 'border-gray-600'
  },
};

const HOUR_HEIGHT = 80;
const START_HOUR = 7;
const END_HOUR = 24;

type AppointmentGroup = Appointment | Appointment[];

function groupOverlappingAppointments(appointments: Appointment[]): AppointmentGroup[] {
  if (appointments.length === 0) return [];

  const sorted = [...appointments].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  const groups: Appointment[][] = [];

  for (const apt of sorted) {
    const aptStart = new Date(apt.scheduledAt).getTime();
    const aptEnd = aptStart + apt.durationMinutes * 60_000;

    let placed = false;
    for (const group of groups) {
      const groupOverlaps = group.some(g => {
        const gStart = new Date(g.scheduledAt).getTime();
        const gEnd = gStart + g.durationMinutes * 60_000;
        return aptStart < gEnd && gStart < aptEnd;
      });

      if (groupOverlaps) {
        group.push(apt);
        placed = true;
        break;
      }
    }

    if (!placed) {
      groups.push([apt]);
    }
  }

  return groups.map(group => (group.length === 1 ? group[0] : group));
}

interface ModernCalendarProps {
  professionalId?: string;
}

export function ModernCalendar({ professionalId }: ModernCalendarProps) {
  const { user } = useAuthContext();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  // State para o sheet de novo agendamento
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedSlotDate, setSelectedSlotDate] = useState<Date | null>(null);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>(null);

  // State para o sheet de detalhes do agendamento
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // State para edição de agendamento
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // State para o sheet de lista de agendamentos agrupados
  const [groupedAppointments, setGroupedAppointments] = useState<Appointment[]>([]);
  const [listSheetOpen, setListSheetOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const weekStart = startOfWeek(currentWeek, { locale: ptBR });
  const weekEnd = endOfWeek(currentWeek, { locale: ptBR });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const startDate = format(weekStart, "yyyy-MM-dd'T'00:00:00");
  const endDate = format(weekEnd, "yyyy-MM-dd'T'23:59:59");

  const tenantQuery = useAppointmentsByDateRange(
    !professionalId ? (user?.clinicId ?? null) : null,
    startDate,
    endDate
  );

  const professionalQuery = useAppointmentsByProfessional(
    professionalId ?? '',
    startDate,
    endDate
  );

  const { data: appointments = [], isLoading } = professionalId ? professionalQuery : tenantQuery;

  // Excluir agendamentos cancelados da exibição no calendário
  const visibleAppointments = useMemo(
    () => appointments.filter(apt => apt.status !== 'CANCELADO'),
    [appointments]
  );

  const appointmentsByDay = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    
    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      grouped[dayKey] = visibleAppointments.filter(apt => 
        isSameDay(parseISO(apt.scheduledAt), day)
      ).sort((a, b) => 
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
    });
    
    return grouped;
  }, [visibleAppointments, weekDays]);

  const timeSlots = useMemo(() => {
    const slots: { hour: number; minute: number }[] = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
      slots.push({ hour: h, minute: 0 });
      slots.push({ hour: h, minute: 30 });
    }
    return slots;
  }, []);

  const handlePreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const handleNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const handleToday = () => setCurrentWeek(new Date());

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailsSheetOpen(true);
  };
  
  const handleGroupClick = (group: Appointment[]) => {
    setGroupedAppointments(group);
    setListSheetOpen(true);
  };

  const handleSelectFromList = (appointment: Appointment) => {
    setListSheetOpen(false);
    setSelectedAppointment(appointment);
    setDetailsSheetOpen(true);
  };

  const handleEditAppointment = useCallback((appointment: Appointment) => {
    setEditingAppointment(appointment);
    setSheetOpen(true);
  }, []);

  const handleTimeSlotClick = useCallback((day: Date, hour: number, minute: number = 0) => {
    const slotDate = startOfDay(day);
    const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    setEditingAppointment(null);
    setSelectedSlotDate(slotDate);
    setSelectedSlotTime(slotTime);
    setSheetOpen(true);
  }, []);

  const handleSheetSuccess = useCallback(() => {
    // O hook já invalida os queries, mas podemos forçar um refetch
  }, []);

  const getCurrentTimePosition = () => {
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    
    if (currentHour < START_HOUR || currentHour >= END_HOUR) return null;
    
    const hourOffset = currentHour - START_HOUR;
    const minuteOffset = (currentMinute / 60) * HOUR_HEIGHT;
    
    return hourOffset * HOUR_HEIGHT + minuteOffset;
  };

  const currentTimePosition = getCurrentTimePosition();

  const getAppointmentStyle = (appointment: Appointment) => {
    const startTime = parseISO(appointment.scheduledAt);
    const hour = startTime.getHours();
    const minute = startTime.getMinutes();
    
    const hourOffset = hour - START_HOUR;
    const minuteOffset = (minute / 60) * HOUR_HEIGHT;
    const top = hourOffset * HOUR_HEIGHT + minuteOffset;
    
    const height = (appointment.durationMinutes / 60) * HOUR_HEIGHT;
    
    return { top, height };
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Carregando agendamentos...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleToday}>
                Hoje
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">
                {format(weekStart, 'dd', { locale: ptBR })} - {format(weekEnd, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </h3>
            </div>
          </div>

          {/* Legenda */}
          <div className="hidden lg:flex items-center gap-3">
            {Object.entries(statusConfig).map(([status, config]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`h-3 w-3 rounded-full ${config.bg}`} />
                <span className="text-xs text-muted-foreground">{config.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Calendário */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-8 border-b border-t bg-muted/50">
              <div className="p-4 font-medium text-sm text-muted-foreground border-r">
                Horário
              </div>
              {weekDays.map((day, index) => (
                <div
                  key={day.toISOString()}
                  className={`p-4 text-center ${
                    index < weekDays.length - 1 ? 'border-r' : ''
                  } ${isToday(day) ? 'bg-blue-50 dark:bg-blue-950/40' : ''}`}
                >
                  <div className="font-medium text-sm capitalize">
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div className={`text-2xl font-bold mt-1 ${
                    isToday(day) ? 'text-blue-600' : 'text-foreground'
                  }`}>
                    {format(day, 'dd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Grid de horários — flat grid garante alinhamento perfeito entre todas as colunas */}
            <div className="relative">
              <div
                className="grid grid-cols-8"
                style={{ gridTemplateRows: `repeat(${timeSlots.length}, ${HOUR_HEIGHT / 2}px)` }}
              >
                {timeSlots.flatMap(({ hour, minute }) => [
                  // Célula de rótulo de horário
                  <div
                    key={`label-${hour}-${minute}`}
                    className={`border-r border-b${minute === 30 ? ' border-dashed' : ''}`}
                  >
                    {minute === 0 ? (
                      <span className="text-xs text-muted-foreground p-2 block leading-none">
                        {hour.toString().padStart(2, '0')}:00
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50 px-2 block leading-none mt-1">
                        {hour.toString().padStart(2, '0')}:30
                      </span>
                    )}
                  </div>,
                  // Células dos dias
                  ...weekDays.map((day, dayIndex) => (
                    <div
                      key={`${day.toISOString()}-${hour}-${minute}`}
                      className={`border-b hover:bg-accent/50 cursor-pointer transition-colors${
                        minute === 30 ? ' border-dashed' : ''
                      }${dayIndex < weekDays.length - 1 ? ' border-r' : ''}${
                        isToday(day) ? ' bg-blue-50/30 dark:bg-blue-950/20' : ''
                      }`}
                      onDoubleClick={() => handleTimeSlotClick(day, hour, minute)}
                      title="Duplo clique para agendar"
                    />
                  )),
                ])}
              </div>

              {/* Overlays de agendamentos por coluna de dia (sobre o grid) */}
              {weekDays.map((day, dayIndex) => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const dayAppointments = appointmentsByDay[dayKey] || [];

                return (
                  <div
                    key={day.toISOString()}
                    className="absolute top-0 pointer-events-none"
                    style={{
                      left: `${((dayIndex + 1) / 8) * 100}%`,
                      width: `${(1 / 8) * 100}%`,
                      height: '100%',
                    }}
                  >
                    {/* Agendamentos (agrupados quando sobrepostos) */}
                    {groupOverlappingAppointments(dayAppointments).map((item, groupIndex) => {
                      if (!Array.isArray(item)) {
                        // Agendamento único
                        const appointment = item;
                        const { top, height } = getAppointmentStyle(appointment);
                        const config = statusConfig[appointment.status];

                        return (
                          <div
                            key={appointment.id}
                            className={`absolute left-1 right-1 rounded-lg border-2 p-2 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${config.bg} ${config.border}`}
                            style={{
                              top: `${top}px`,
                              height: `${Math.max(height, 40)}px`,
                              zIndex: 10,
                              pointerEvents: 'auto',
                            }}
                            onClick={() => handleAppointmentClick(appointment)}
                          >
                            <div className="flex flex-col h-full overflow-hidden text-white">
                              <div className="flex items-center gap-1 mb-1">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span className="text-xs font-bold">
                                  {format(parseISO(appointment.scheduledAt), 'HH:mm')}
                                </span>
                              </div>
                              <p className="font-bold text-sm line-clamp-1">
                                {appointment.patient.fullName}
                              </p>
                              {height > 60 && (
                                <p className="text-xs font-medium opacity-90 line-clamp-1">
                                  {appointment.professional.user.fullName}
                                </p>
                              )}
                              {height > 80 && appointment.room?.name && (
                                <Badge
                                  variant="secondary"
                                  className="mt-auto w-fit text-xs bg-white/20 text-white border-white/30"
                                >
                                  {appointment.room.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // Grupo de agendamentos sobrepostos
                      const group = item;
                      const earliestStart = Math.min(
                        ...group.map(a => new Date(a.scheduledAt).getTime())
                      );
                      const latestEnd = Math.max(
                        ...group.map(a => new Date(a.scheduledAt).getTime() + a.durationMinutes * 60_000)
                      );

                      const startDate = new Date(earliestStart);
                      const hourOffset = startDate.getHours() - START_HOUR;
                      const minuteOffset = (startDate.getMinutes() / 60) * HOUR_HEIGHT;
                      const top = hourOffset * HOUR_HEIGHT + minuteOffset;

                      const durationMs = latestEnd - earliestStart;
                      const durationMinutes = durationMs / 60_000;
                      const height = (durationMinutes / 60) * HOUR_HEIGHT;

                      return (
                        <div
                          key={`group-${groupIndex}`}
                          className="absolute left-1 right-1 rounded-lg border-2 p-2 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] bg-violet-100 border-violet-300 dark:bg-violet-950 dark:border-violet-700"
                          style={{
                            top: `${top}px`,
                            height: `${Math.max(height, 40)}px`,
                            zIndex: 10,
                            pointerEvents: 'auto',
                          }}
                          onClick={() => handleGroupClick(group)}
                        >
                          <div className="flex flex-col h-full overflow-hidden">
                            <div className="flex items-center gap-1 mb-1">
                              <Clock className="h-3 w-3 flex-shrink-0 text-violet-600 dark:text-violet-400" />
                              <span className="text-xs font-bold text-violet-700 dark:text-violet-300">
                                {format(startDate, 'HH:mm')}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 mb-1">
                              <div className="flex -space-x-1">
                                {group.map(apt => {
                                  const c = statusConfig[apt.status];
                                  return (
                                    <div
                                      key={apt.id}
                                      className={`h-3 w-3 rounded-full border border-white ${c.bg}`}
                                      title={`${apt.professional.user.fullName} - ${c.label}`}
                                    />
                                  );
                                })}
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 flex-shrink-0 text-violet-600 dark:text-violet-400" />
                              <p className="font-bold text-xs text-violet-700 dark:text-violet-300 line-clamp-1">
                                {group.length} agendamentos
                              </p>
                            </div>

                            {height > 70 && (
                              <p className="text-xs text-violet-600 dark:text-violet-400 line-clamp-2 mt-0.5">
                                {group.map(a => a.professional.user.fullName.split(' ')[0]).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Indicador de hora atual */}
                    {isToday(day) && currentTimePosition !== null && (
                      <div
                        className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
                        style={{ top: `${currentTimePosition}px` }}
                      >
                        <div className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-red-500" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Sheet para novo/editar agendamento */}
      <AppointmentSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingAppointment(null);
        }}
        defaultDate={selectedSlotDate}
        defaultTime={selectedSlotTime}
        defaultProfessionalId={professionalId}
        editingAppointment={editingAppointment}
        onSuccess={handleSheetSuccess}
      />

      {/* Sheet para detalhes do agendamento */}
      <AppointmentDetailsSheet
        open={detailsSheetOpen}
        onOpenChange={setDetailsSheetOpen}
        appointment={selectedAppointment}
        onEdit={handleEditAppointment}
        onSuccess={handleSheetSuccess}
      />

      {/* Sheet para lista de agendamentos agrupados */}
      <AppointmentListSheet
        open={listSheetOpen}
        onOpenChange={setListSheetOpen}
        appointments={groupedAppointments}
        onSelectAppointment={handleSelectFromList}
      />
    </div>
  );
}