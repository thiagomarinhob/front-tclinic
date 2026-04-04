'use client'

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
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
import { useProcedures } from '@/hooks/useProcedures';
import { useAuthContext } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { getProfessionalByUserIdAction } from '@/actions/professional-actions';
import { toast } from 'sonner';
import { ConflictDialog } from './ConflictDialog';
import { PatientAutocomplete } from './PatientAutocomplete';
import { ProfessionalAutocomplete } from './ProfessionalAutocomplete';
import { RoomSelect } from './RoomSelect';
import {
  CalendarIcon,
  Loader2,
  Plus,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, formatCurrency } from '@/lib/utils';
import type { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest } from '@/types';
import { SPECIALTY_LABELS } from '@/types';
import type { Procedure as ProcedureType } from '@/types/procedure.types';
import { parseISO } from 'date-fns';

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

interface AppointmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date | null;
  defaultTime?: string | null;
  defaultProfessionalId?: string | null;
  editingAppointment?: Appointment | null;
  onSuccess?: () => void;
}

export function AppointmentSheet({
  open,
  onOpenChange,
  defaultDate,
  defaultTime,
  defaultProfessionalId,
  editingAppointment,
  onSuccess,
}: AppointmentSheetProps) {
  const isEditing = !!editingAppointment;
  const { user } = useAuthContext();
  const isProfessional = user?.role === UserRole.PROFISSIONAL_SAUDE;
  const [ownProfessionalLabel, setOwnProfessionalLabel] = useState<string>('');

  const { procedures: proceduresData, isLoading: loadingProcedures } = useProcedures(
    user?.clinicId || null,
    0,
    100,
    { active: true }
  );
  const {
    createAppointment,
    updateAppointment,
    confirmConflict,
    cancelConflict,
    pendingConflict,
    isCreating,
    isUpdating,
  } = useAppointments();
  const isSaving = isEditing ? isUpdating : isCreating;
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

  // Reset form and set default values when sheet opens
  useEffect(() => {
    if (open) {
      if (editingAppointment) {
        const scheduledDate = parseISO(editingAppointment.scheduledAt);
        reset({
          patientId: editingAppointment.patient.id,
          professionalId: editingAppointment.professional.id,
          roomId: editingAppointment.room?.id,
          date: scheduledDate,
          time: format(scheduledDate, 'HH:mm'),
          durationMinutes: editingAppointment.durationMinutes,
          observations: editingAppointment.observations || '',
          procedureIds: editingAppointment.procedures?.map(p => p.id) || [],
        });
      } else {
        reset({
          professionalId: defaultProfessionalId || undefined,
          durationMinutes: 60,
          procedureIds: [],
          date: defaultDate || undefined,
          time: defaultTime || '',
        });
      }
      setAvailabilityStatus(null);
      setSelectedProcedureId('');
    }
  }, [open, defaultDate, defaultTime, defaultProfessionalId, editingAppointment, reset]);

  // Se o usuário logado é profissional, pré-preenche o campo com seu próprio perfil
  useEffect(() => {
    if (!open || !isProfessional || !user?.id || isEditing) return;
    getProfessionalByUserIdAction(user.id).then((result) => {
      if (result.success && result.data) {
        setValue('professionalId', result.data.id);
        setOwnProfessionalLabel(
          `${user.fullName} - ${SPECIALTY_LABELS[result.data.specialty as keyof typeof SPECIALTY_LABELS] || result.data.specialty}`
        );
      }
    });
  }, [open, isProfessional, user?.id, user?.fullName, isEditing, setValue]);

  // Verificar disponibilidade em tempo real
  useEffect(() => {
    if (professionalId && date && time) {
      const checkTimeout = setTimeout(async () => {
        const scheduledAt = `${format(date, 'yyyy-MM-dd')}T${time}:00`;

        const result = await checkAvailability(
          professionalId,
          scheduledAt,
          durationMinutes,
          editingAppointment?.id
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
  }, [professionalId, date, time, durationMinutes, checkAvailability, editingAppointment?.id]);

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

      if (isEditing && editingAppointment) {
        const updateData: UpdateAppointmentRequest = {
          professionalId: data.professionalId,
          roomId: data.roomId,
          scheduledAt,
          durationMinutes: data.durationMinutes,
          observations: data.observations,
        };

        await updateAppointment(editingAppointment.id, updateData);
      } else {
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
      }

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

  // Gerar opções de horário (7h às 23h45, intervalo de 15 minutos)
  const timeSlots = [];
  for (let hour = 7; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(timeStr);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
          <SheetHeader className="p-6 pb-2 flex-shrink-0">
            <SheetTitle>{isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}</SheetTitle>
            <SheetDescription>
              {isEditing
                ? 'Altere os dados do agendamento.'
                : 'Preencha os dados para criar um novo agendamento.'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6">
            <form id="appointment-sheet-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-6">
              {/* Paciente */}
              <div className="space-y-2">
                <Label>Paciente *</Label>
                {isEditing && editingAppointment ? (
                  <Input
                    value={editingAppointment.patient.fullName}
                    disabled
                    className="bg-muted"
                  />
                ) : (
                  <PatientAutocomplete
                    onSelect={(patient) => setValue('patientId', patient.id)}
                    error={errors.patientId?.message}
                  />
                )}
              </div>

              {/* Profissional */}
              <div className="space-y-2">
                <Label htmlFor="professionalId">Profissional *</Label>
                {isProfessional ? (
                  <Input
                    value={
                      isEditing && editingAppointment
                        ? `${editingAppointment.professional.user.fullName}`
                        : ownProfessionalLabel || 'Carregando...'
                    }
                    disabled
                    className="bg-muted"
                  />
                ) : (
                  <ProfessionalAutocomplete
                    value={watch('professionalId')}
                    onSelect={(id) => setValue('professionalId', id)}
                    error={errors.professionalId?.message}
                  />
                )}
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

          <SheetFooter className="p-6 pt-4 border-t flex-shrink-0">
            <div className="flex items-center gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="appointment-sheet-form"
                disabled={isSaving || !user?.id || !user?.clinicId}
                className="flex-1"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Criar Agendamento'}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Dialog de conflito */}
      <ConflictDialog
        open={!!pendingConflict}
        message={pendingConflict?.error || ''}
        onConfirm={confirmConflict}
        onCancel={cancelConflict}
        isLoading={isSaving}
      />
    </>
  );
}
