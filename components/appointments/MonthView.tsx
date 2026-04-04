'use client'

import { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppointmentsByDateRange, useAppointmentsByProfessional } from '@/hooks/useAppointments';
import { useAuthContext } from '@/contexts/AuthContext';
import { 
  format, 
  startOfMonth, 
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
  isSameMonth,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Appointment } from '@/types';
import { AppointmentSheet } from './AppointmentSheet';
import { AppointmentDetailsSheet } from './AppointmentDetailsSheet';
import { AppointmentListSheet } from './AppointmentListSheet';

interface MonthViewProps {
  professionalId?: string;
}

export function MonthView({ professionalId }: MonthViewProps) {
  const { user } = useAuthContext();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // State para o sheet de lista de agendamentos do dia
  const [listSheetOpen, setListSheetOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayAppointments, setDayAppointments] = useState<Appointment[]>([]);

  // State para o sheet de detalhes do agendamento
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // State para o sheet de novo/editar agendamento
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedSlotDate, setSelectedSlotDate] = useState<Date | null>(null);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const startDate = format(calendarStart, "yyyy-MM-dd'T'00:00:00");
  const endDate = format(calendarEnd, "yyyy-MM-dd'T'23:59:59");

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

  // Agrupar agendamentos por dia
  const appointmentsByDay = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    
    calendarDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      grouped[dayKey] = visibleAppointments.filter(apt => 
        isSameDay(parseISO(apt.scheduledAt), day)
      );
    });
    
    return grouped;
  }, [visibleAppointments, calendarDays]);

  const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const handleDayClick = (day: Date) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const appointments = (appointmentsByDay[dayKey] || []).sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
    setSelectedDate(day);
    setDayAppointments(appointments);
    setListSheetOpen(true);
  };

  const handleSelectFromList = useCallback((appointment: Appointment) => {
    setListSheetOpen(false);
    setSelectedAppointment(appointment);
    setDetailsSheetOpen(true);
  }, []);

  const handleEditAppointment = useCallback((appointment: Appointment) => {
    setEditingAppointment(appointment);
    setSheetOpen(true);
  }, []);

  const handleAddNewForDay = useCallback(() => {
    if (!selectedDate) return;
    setListSheetOpen(false);
    setEditingAppointment(null);
    setSelectedSlotDate(startOfDay(selectedDate));
    setSelectedSlotTime(null);
    setSheetOpen(true);
  }, [selectedDate]);

  const handleSheetSuccess = useCallback(() => {
    setSheetOpen(false);
    setDetailsSheetOpen(false);
    setEditingAppointment(null);
    setSelectedAppointment(null);
    setSelectedSlotDate(null);
    setSelectedSlotTime(null);
  }, []);

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <h3 className="text-xl font-bold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>

        <div className="w-[140px]" /> {/* Spacer */}
      </div>

      {/* Cabeçalho dos dias da semana */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Grid do calendário */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map(day => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayAppointments = appointmentsByDay[dayKey] || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[100px] p-2 rounded-lg border-2 transition-all cursor-pointer ${
                isToday(day)
                  ? 'border-blue-500 bg-blue-50'
                  : isCurrentMonth
                  ? 'border-border hover:border-blue-300 hover:bg-accent'
                  : 'border-border/50 bg-muted/30'
              }`}
              onClick={() => handleDayClick(day)}
            >
              <div className={`text-sm font-semibold mb-1 ${
                isToday(day)
                  ? 'text-blue-600'
                  : isCurrentMonth
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}>
                {format(day, 'd')}
              </div>

              <div className="space-y-1">
                {dayAppointments.slice(0, 3).map(apt => (
                  <div
                    key={apt.id}
                    className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 truncate"
                  >
                    {format(parseISO(apt.scheduledAt), 'HH:mm')} - {apt.patient.fullName}
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-muted-foreground px-1.5">
                    +{dayAppointments.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sheet para lista de agendamentos do dia */}
      <AppointmentListSheet
        open={listSheetOpen}
        onOpenChange={setListSheetOpen}
        appointments={dayAppointments}
        onSelectAppointment={handleSelectFromList}
        title={selectedDate ? `Agendamentos - ${format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}` : undefined}
        description={dayAppointments.length > 0 ? `${dayAppointments.length} agendamento${dayAppointments.length !== 1 ? 's' : ''} neste dia` : undefined}
        emptyState={{
          message: 'Nenhum agendamento neste dia',
          onAddNew: handleAddNewForDay,
        }}
      />

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
    </Card>
  );
}