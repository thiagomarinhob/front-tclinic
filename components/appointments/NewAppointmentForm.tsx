'use client'

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Clock,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import { format, parse } from 'date-fns';
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
  time: z.string().min(1, 'Informe o horário'),
  durationMinutes: z.number().min(15, 'Duração mínima de 15 minutos').optional(),
  observations: z.string().optional(),
  procedureIds: z.array(z.string()).optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export function NewAppointmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthContext();
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      durationMinutes: 60,
      procedureIds: [],
    },
  });

  const isProfessional = user?.role === UserRole.PROFISSIONAL_SAUDE;
  const [ownProfessionalLabel, setOwnProfessionalLabel] = useState<string>('');

  const professionalId = watch('professionalId');
  const { procedures: proceduresData, isLoading: loadingProcedures } = useProcedures(
    user?.clinicId || null,
    0,
    100,
    { active: true, professionalId: professionalId || undefined },
    { enabled: !!professionalId }
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

  const selectedProcedureIds = watch('procedureIds') || [];
  const date = watch('date');
  const time = watch('time');
  const durationMinutes = watch('durationMinutes') || 60;

  const availableProcedures: ProcedureType[] = professionalId ? (proceduresData?.content || []) : [];
  const selectedProcedures = availableProcedures.filter(p => selectedProcedureIds.includes(p.id));
  const totalDurationFromProcedures = selectedProcedures.reduce((sum, p) => sum + p.estimatedDurationMinutes, 0);
  const hasProcedures = selectedProcedures.length > 0;
  const effectiveDuration = hasProcedures ? totalDurationFromProcedures : durationMinutes;

  // Se o usuário logado é profissional, pré-preenche o campo com seu próprio perfil
  useEffect(() => {
    if (!isProfessional || !user?.id) return;
    getProfessionalByUserIdAction(user.id).then((result) => {
      if (result.success && result.data) {
        setValue('professionalId', result.data.id);
        setOwnProfessionalLabel(
          `${user.fullName} - ${SPECIALTY_LABELS[result.data.specialty as keyof typeof SPECIALTY_LABELS] || result.data.specialty}`
        );
      }
    });
  }, [isProfessional, user?.id, user?.fullName, setValue]);

  // Limpar procedimentos e horário selecionados quando mudar o profissional
  useEffect(() => {
    setValue('procedureIds', []);
    setValue('time', '');
    setSelectedProcedureId('');
  }, [professionalId, setValue]);

  // Pré-preencher data se vier da URL
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      try {
        const parsedDate = parse(dateParam, 'yyyy-MM-dd', new Date());
        setValue('date', parsedDate);
      } catch (error) {
        console.error('Erro ao parsear data da URL:', error);
      }
    }
  }, [searchParams, setValue]);

  // Verificar disponibilidade em tempo real
  useEffect(() => {
    if (professionalId && date && time) {
      const checkTimeout = setTimeout(async () => {
        const scheduledAt = `${format(date, 'yyyy-MM-dd')}T${time}:00`;

        const result = await checkAvailability(
          professionalId,
          scheduledAt,
          effectiveDuration
        );

        if (result.success) {
          const isAvailable = result.data || false;
          setAvailabilityStatus({
            isAvailable,
            message: isAvailable
              ? '✓ Horário disponível'
              : '⚠ Horário indisponível. O profissional pode não atender neste dia ou há conflito com outro agendamento. Você pode agendar mesmo assim se desejar.',
          });
        } else {
          setAvailabilityStatus({
            isAvailable: false,
            message: result.error || '✗ Erro ao verificar disponibilidade',
          });
        }
      }, 500);

      return () => clearTimeout(checkTimeout);
    } else {
      setAvailabilityStatus(null);
    }
  }, [professionalId, date, time, effectiveDuration, checkAvailability]);

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
      const finalDuration = hasProcedures ? totalDurationFromProcedures : (data.durationMinutes || 60);

      const requestData: CreateAppointmentRequest = {
        tenantId: user.clinicId,
        createdBy: user.id,
        patientId: data.patientId,
        professionalId: data.professionalId,
        roomId: data.roomId,
        scheduledAt,
        durationMinutes: finalDuration,
        observations: data.observations,
        totalValue,
        procedureIds: data.procedureIds,
      };

      await createAppointment(requestData);
      router.push('/appointments');
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

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Agendamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              {isProfessional ? (
                <Input
                  value={ownProfessionalLabel || 'Carregando...'}
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
          </CardContent>
        </Card>

        {/* Data e Horário */}
        <Card>
          <CardHeader>
            <CardTitle>Data e Horário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
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
                      {date ? format(date, 'PPP', { locale: ptBR }) : 'Selecione a data'}
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
                <Input
                  id="time"
                  type="time"
                  {...register('time')}
                  className={errors.time ? 'border-red-500' : ''}
                />
                {errors.time && (
                  <p className="text-sm text-red-500">{errors.time.message}</p>
                )}
              </div>

              {/* Duração */}
              <div className="space-y-2">
                <Label htmlFor="durationMinutes">Duração</Label>
                {hasProcedures ? (
                  <p className="text-sm font-medium py-2 text-muted-foreground">
                    {formatDuration(totalDurationFromProcedures)} (calculado dos procedimentos)
                  </p>
                ) : (
                  <>
                    <Input
                      id="durationMinutes"
                      type="number"
                      {...register('durationMinutes', { valueAsNumber: true })}
                      placeholder="60"
                      min="15"
                      step="15"
                    />
                    <p className="text-xs text-muted-foreground">
                      Padrão: 60 minutos
                    </p>
                  </>
                )}
              </div>
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
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">{availabilityStatus.message}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Procedimentos */}
        <Card>
          <CardHeader>
            <CardTitle>Procedimentos (Opcional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!professionalId ? (
              <p className="text-sm text-muted-foreground">
                Selecione um profissional acima para adicionar procedimentos.
              </p>
            ) : (
              <div className="flex items-center gap-2 w-fit">
                <div className="w-[400px]">
                  <Select
                    value={selectedProcedureId}
                    onValueChange={setSelectedProcedureId}
                    disabled={loadingProcedures}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        loadingProcedures
                          ? 'Carregando procedimentos...'
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
                          Nenhum procedimento cadastrado para este profissional
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddProcedure}
                  disabled={!selectedProcedureId || loadingProcedures}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Lista de Procedimentos Selecionados */}
            {selectedProcedures.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum procedimento adicionado
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedProcedures.map((procedure) => (
                  <div
                    key={procedure.id}
                    className="flex items-start justify-between p-3 border rounded-lg bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{procedure.name}</div>
                      {procedure.description && (
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {procedure.description}
                        </div>
                      )}
                      <div className="flex flex-col gap-1 mt-2 text-sm">
                        <span className="text-muted-foreground">
                          Duração: {formatDuration(procedure.estimatedDurationMinutes)}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(procedure.basePrice)}
                        </span>
                        {procedure.professionalCommissionPercent && (
                          <span className="text-muted-foreground">
                            Comissão: {procedure.professionalCommissionPercent}%
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveProcedure(procedure.id)}
                      className="ml-2 flex-shrink-0"
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações (Opcional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              {...register('observations')}
              placeholder="Informações adicionais sobre o agendamento..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isCreating || !user?.id || !user?.clinicId}
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Agendamento
          </Button>
        </div>
      </form>

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
