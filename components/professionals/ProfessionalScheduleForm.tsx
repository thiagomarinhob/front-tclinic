'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Calendar } from 'lucide-react';
import {
  ProfessionalSchedule,
  DayOfWeek,
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_ORDER,
} from '@/types/professional-schedule.types';
import {
  createProfessionalScheduleAction,
  deleteProfessionalScheduleAction,
  getProfessionalSchedulesByProfessionalIdAction,
} from '@/actions/professional-schedule-actions';
import { Checkbox } from '@/components/ui/checkbox';

interface ProfessionalScheduleFormProps {
  professionalId: string;
  professionalName: string;
}

export function ProfessionalScheduleForm({ professionalId, professionalName }: ProfessionalScheduleFormProps) {
  const [schedules, setSchedules] = useState<ProfessionalSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingDay, setLoadingDay] = useState<DayOfWeek | null>(null);

  const loadSchedules = async () => {
    setIsLoading(true);
    try {
      const result = await getProfessionalSchedulesByProfessionalIdAction(professionalId);
      if (result.success && result.data) {
        setSchedules(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dias de atendimento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalId]);

  const getScheduleForDay = (dayOfWeek: DayOfWeek): ProfessionalSchedule | undefined => {
    return schedules.find((s) => s.dayOfWeek === dayOfWeek);
  };

  const handleToggleDay = async (dayOfWeek: DayOfWeek, checked: boolean) => {
    if (loadingDay) return;
    setLoadingDay(dayOfWeek);
    try {
      if (checked) {
        const result = await createProfessionalScheduleAction({ professionalId, dayOfWeek });
        if (result.success) {
          toast.success(`${DAY_OF_WEEK_LABELS[dayOfWeek]} adicionado com sucesso!`);
          await loadSchedules();
        } else {
          toast.error(result.error || 'Erro ao adicionar dia de atendimento');
        }
      } else {
        const schedule = getScheduleForDay(dayOfWeek);
        if (!schedule) return;
        const result = await deleteProfessionalScheduleAction(schedule.id);
        if (result.success) {
          toast.success(`${DAY_OF_WEEK_LABELS[dayOfWeek]} removido com sucesso!`);
          await loadSchedules();
        } else {
          toast.error(result.error || 'Erro ao remover dia de atendimento');
        }
      }
    } catch (error) {
      toast.error('Erro inesperado');
      console.error(error);
    } finally {
      setLoadingDay(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Dias de Atendimento
        </CardTitle>
        <CardDescription>
          Selecione os dias em que {professionalName} atende
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {DAY_OF_WEEK_ORDER.map((dayOfWeek) => {
            const schedule = getScheduleForDay(dayOfWeek);
            const isChecked = !!schedule;
            const isLoadingThis = loadingDay === dayOfWeek;

            return (
              <div key={dayOfWeek} className="flex items-center gap-3">
                {isLoadingThis ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Checkbox
                    id={`day-${dayOfWeek}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => handleToggleDay(dayOfWeek, !!checked)}
                    disabled={!!loadingDay}
                  />
                )}
                <Label
                  htmlFor={`day-${dayOfWeek}`}
                  className="cursor-pointer font-medium"
                >
                  {DAY_OF_WEEK_LABELS[dayOfWeek]}
                </Label>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
