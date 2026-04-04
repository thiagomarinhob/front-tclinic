'use client'

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useAppointments } from '@/hooks/useAppointments';
import { useAvailability } from '@/hooks/useAvailability';
import { useProfessionalsByCurrentClinic } from '@/hooks/useProfessionals';
import { useProcedures } from '@/hooks/useProcedures';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ConflictDialog } from './ConflictDialog';
import { PatientAutocomplete } from './PatientAutocomplete';
import { RoomSelect } from './RoomSelect';
import {
  CalendarIcon,
  Loader2,
  Plus,
  AlertCircle,
  CheckCircle,
  X,
  CalendarPlus,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, formatCurrency } from '@/lib/utils';
import type { CreateAppointmentRequest } from '@/types';
import { SPECIALTY_LABELS } from '@/types';
import type { Procedure as ProcedureType } from '@/types/procedure.types';

const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Selecione um paciente'),
  professionalId: z.string().min(1, 'Selecione um profissional'),
  roomId: z.string().optional(),
  date: z.date({ message: 'Selecione uma data' }),
  time: z.string().min(1, 'Selecione um horário'),
  durationMinutes: z.number().min(15, 'Duração mínima de 15 minutos').optional(),
  observations: z.string().optional(),
  procedureIds: z.array(z.string()).optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date | null;
  defaultTime?: string | null;
  onSuccess?: () => void;
}

export function AppointmentDialog({
  open,
  onOpenChange,
  defaultDate,
  defaultTime,
  onSuccess,
}: AppointmentDialogProps) {
  const { user } = useAuthContext();
  const { professionals, isLoading: loadingProfessionals } = useProfessionalsByCurrentClinic(0, 100);
  const { procedures: proceduresData, isLoading: loadingProcedures } = useProcedures(
    user?.clinicId || null,
    0,
    100,
    { active: true }
  );
  const {
    createAppointment,
    confirmConflict,
    cancelConflict,
    pendingConflict,
    isCreating
  } = useAppointments();
  const { checkAvailability, isChecking } = useAvailability();

  const [availabilityStatus, setAvailabilityStatus] = useState<{
    isAvailable: boolean;
    message: string;
  } | null>(null);

  const [selectedProcedureId, setSelectedProcedureId] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      durationMinutes: 60,
      procedureIds: [],
    },
  });

  const selectedProcedureIds = watch('procedureIds') || [];
  const professionalId = watch('professionalId');
  const date = watch('date');
  const time = watch('time');
  const durationMinutes = watch('durationMinutes') || 60;

  useEffect(() => {
    if (open) {
      reset({
        durationMinutes: 60,
        procedureIds: [],
        date: defaultDate || undefined,
        time: defaultTime || '',
      });
      setAvailabilityStatus(null);
      setSelectedProcedureId('');
    }
  }, [open, defaultDate, defaultTime, reset]);

  useEffect(() => {
    if (professionalId && date && time) {
      const checkTimeout = setTimeout(async () => {
        const scheduledAt = `${format(date, 'yyyy-MM-dd')}T${time}:00`;

        const result = await checkAvailability(
          professionalId,
          scheduledAt,
          durationMinutes
        );

        if (result.success) {
          const isAvailable = result.data || false;
          setAvailabilityStatus({
            isAvailable,
            message: isAvailable
              ? 'Horário disponível'
              : 'Horário não disponível. Você pode agendar mesmo assim.',
          });
        } else {
          setAvailabilityStatus({
            isAvailable: false,
            message: result.error || 'Erro ao verificar disponibilidade',
          });
        }
      }, 500);

      return () => clearTimeout(checkTimeout);
    } else {
      setAvailabilityStatus(null);
    }
  }, [professionalId, date, time, durationMinutes, checkAvailability]);

  const handleAddProcedure = () => {
    if (selectedProcedureId && !selectedProcedureIds.includes(selectedProcedureId)) {
      setValue('procedureIds', [...selectedProcedureIds, selectedProcedureId]);
      setSelectedProcedureId('');
    }
  };

  const handleRemoveProcedure = (procedureId: string) => {
    setValue('procedureIds', selectedProcedureIds.filter(id => id !== procedureId));
  };

  const onSubmit = async (data: AppointmentFormData) => {
    try {
      if (!user?.id || !user?.clinicId) {
        toast.error('Sessão inválida. Faça login novamente.');
        return;
      }

      const scheduledAt = `${format(data.date, 'yyyy-MM-dd')}T${data.time}:00`;
      const totalValue = selectedProcedures.reduce((sum, p) => sum + (p.basePrice ?? 0), 0);

      const requestData: CreateAppointmentRequest = {
        tenantId: user.clinicId,
        createdBy: user.id,
        patientId: data.patientId,
        professionalId: data.professionalId,
        roomId: data.roomId,
        scheduledAt,
        durationMinutes: data.durationMinutes,
        observations: data.observations,
        totalValue,
        procedureIds: data.procedureIds,
      };

      await createAppointment(requestData);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Erro tratado no hook
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const availableProcedures: ProcedureType[] = proceduresData?.content || [];
  const selectedProcedures = availableProcedures.filter(p => selectedProcedureIds.includes(p.id));

  const timeSlots = [];
  for (let hour = 7; hour < 20; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(timeStr);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl p-0">
          <DialogHeader className="p-6 pb-2 bg-background sticky top-0 z-10">
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5" />
              Novo Agendamento
            </DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo agendamento.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6">
            <form id="appointment-dialog-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Paciente */}
              <div className="space-y-2">
                <Label>Paciente *</Label>
                <PatientAutocomplete
                  onSelect={(patient) => setValue('patientId', patient.id)}
                  error={errors.patientId?.message}
                />
              </div>

              {/* Profissional */}
              <div className="space-y-2">
                <Label htmlFor="professionalId">Profissional *</Label>
                <Select
                  value={watch('professionalId')}
                  onValueChange={(value) => setValue('professionalId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingProfessionals ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        Carregando...
                      </div>
                    ) : professionals && professionals.length > 0 ? (
                      professionals.map((professional) => (
                        <SelectItem key={professional.id} value={professional.id}>
                          {professional.user.fullName} - {SPECIALTY_LABELS[professional.specialty] || professional.specialty}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        Nenhum profissional cadastrado
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {errors.professionalId && (
                  <p className="text-sm text-red-500">{errors.professionalId.message}</p>
                )}
              </div>

              {/* Sala */}
              <div className="space-y-2">
                <Label htmlFor="roomId">Sala (Opcional)</Label>
                <RoomSelect
                  value={watch('roomId')}
                  onValueChange={(value) => setValue('roomId', value)}
                />
              </div>

              <Separator />

              {/* Data e Horário */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Data e Horário</Label>

                <div className="grid gap-4 grid-cols-2">
                  {/* Data */}
                  <div className="space-y-2">
                    <Label>Data *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !date && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Data'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(date) => date && setValue('date', date)}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.date && (
                      <p className="text-sm text-red-500">{errors.date.message}</p>
                    )}
                  </div>

                  {/* Horário */}
                  <div className="space-y-2">
                    <Label htmlFor="time">Horário *</Label>
                    <Select
                      value={watch('time')}
                      onValueChange={(value) => setValue('time', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Horário" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.time && (
                      <p className="text-sm text-red-500">{errors.time.message}</p>
                    )}
                  </div>
                </div>

                {/* Duração */}
                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">Duração (minutos)</Label>
                  <Input
                    type="number"
                    {...register('durationMinutes', { valueAsNumber: true })}
                    placeholder="60"
                    min="15"
                    step="15"
                  />
                </div>

                {/* Status de disponibilidade */}
                {isChecking && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando disponibilidade...
                  </div>
                )}

                {availabilityStatus && !isChecking && (
                  <div
                    className={cn(
                      'flex items-center gap-2 rounded-lg border p-3',
                      availabilityStatus.isAvailable
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    )}
                  >
                    {availabilityStatus.isAvailable ? (
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="text-sm">{availabilityStatus.message}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Procedimentos */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Procedimentos (Opcional)</Label>

                <div className="flex items-center gap-2">
                  <Select
                    value={selectedProcedureId}
                    onValueChange={setSelectedProcedureId}
                    disabled={loadingProcedures}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={
                        loadingProcedures
                          ? 'Carregando...'
                          : 'Selecione um procedimento'
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingProcedures ? (
                        <div className="p-2 text-sm text-muted-foreground flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Carregando...
                        </div>
                      ) : availableProcedures.length > 0 ? (
                        availableProcedures
                          .filter(p => !selectedProcedureIds.includes(p.id))
                          .map((procedure) => (
                            <SelectItem key={procedure.id} value={procedure.id}>
                              {procedure.name} - {formatCurrency(procedure.basePrice)}
                            </SelectItem>
                          ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">
                          Nenhum procedimento cadastrado
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddProcedure}
                    disabled={!selectedProcedureId || loadingProcedures}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Lista de Procedimentos Selecionados */}
                {selectedProcedures.length > 0 && (
                  <div className="space-y-2">
                    {selectedProcedures.map((procedure) => (
                      <div
                        key={procedure.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{procedure.name}</div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{formatDuration(procedure.estimatedDurationMinutes)}</span>
                            <span>|</span>
                            <span className="font-medium text-foreground">
                              {formatCurrency(procedure.basePrice)}
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveProcedure(procedure.id)}
                          className="ml-2 flex-shrink-0 h-8 w-8"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}

                    {/* Total */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="font-medium">Total:</span>
                      <span className="font-bold">
                        {formatCurrency(selectedProcedures.reduce((sum, p) => sum + (p.basePrice ?? 0), 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Observações */}
              <div className="space-y-2">
                <Label>Observações (Opcional)</Label>
                <Textarea
                  {...register('observations')}
                  placeholder="Informações adicionais sobre o agendamento..."
                  rows={3}
                />
              </div>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t bg-background sticky bottom-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="appointment-dialog-form"
              disabled={isCreating || !user?.id || !user?.clinicId}
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Agendamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de conflito */}
      <ConflictDialog
        open={!!pendingConflict}
        message={pendingConflict?.error || ''}
        onConfirm={confirmConflict}
        onCancel={cancelConflict}
        isLoading={isCreating}
      />
    </>
  );
}
