'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  User,
  MapPin,
  ChevronDown,
  ChevronRight,
  DollarSign,
  FileText,
  Stethoscope,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useQueryClient } from '@tanstack/react-query';
import { useAppointmentsByDateRange, useAppointments } from '@/hooks/useAppointments';
import { useAvailability } from '@/hooks/useAvailability';
import { useProfessionalsByCurrentClinic } from '@/hooks/useProfessionals';
import { useAuthContext } from '@/contexts/AuthContext';
import { cancelAppointmentAction } from '@/actions/appointment-actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { RoomSelect } from './RoomSelect';
import { ConflictDialog } from './ConflictDialog';
import type { Professional, Appointment, UpdateAppointmentRequest } from '@/types';
import { SPECIALTY_LABELS } from '@/types';

interface ProfessionalAppointmentsTableProps {
  professionals: Professional[];
}

const editAppointmentSchema = z.object({
  professionalId: z.string().min(1, 'Selecione um profissional'),
  roomId: z.string().optional(),
  date: z.date({ message: 'Selecione uma data' }),
  time: z.string().min(1, 'Selecione um horário'),
  durationMinutes: z.number().min(15, 'Duração mínima de 15 minutos').optional(),
  observations: z.string().optional(),
});

type EditAppointmentFormData = z.infer<typeof editAppointmentSchema>;

export function ProfessionalAppointmentsTable({ professionals }: ProfessionalAppointmentsTableProps) {
  const { user } = useAuthContext();
  const tenantId = user?.clinicId ?? null;

  // Estados dos dialogs
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado dos dropdowns expandidos
  const [expandedProfessionals, setExpandedProfessionals] = useState<Set<string>>(new Set());

  // Hooks
  const queryClient = useQueryClient();
  const { professionals: allProfessionals, isLoading: loadingProfessionals } = useProfessionalsByCurrentClinic(0, 100);
  const { updateAppointment, confirmConflict, cancelConflict, pendingConflict, isUpdating } = useAppointments();
  const { checkAvailability, isChecking } = useAvailability();

  // Busca agendamentos dos últimos 30 dias até 30 dias no futuro
  const startDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return format(date, "yyyy-MM-dd'T'00:00:00");
  }, []);

  const endDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return format(date, "yyyy-MM-dd'T'23:59:59");
  }, []);

  const { data: appointments, isLoading, refetch } = useAppointmentsByDateRange(
    tenantId,
    startDate,
    endDate
  );

  // Form para edição
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EditAppointmentFormData>({
    resolver: zodResolver(editAppointmentSchema),
    defaultValues: {
      durationMinutes: 60,
    },
  });

  const professionalId = watch('professionalId');
  const date = watch('date');
  const time = watch('time');
  const durationMinutes = watch('durationMinutes') || 60;

  // Estado de disponibilidade
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    isAvailable: boolean;
    message: string;
  } | null>(null);

  // Verificar disponibilidade em tempo real
  useEffect(() => {
    if (professionalId && date && time && selectedAppointment) {
      const checkTimeout = setTimeout(async () => {
        const scheduledAt = `${format(date, 'yyyy-MM-dd')}T${time}:00`;

        const result = await checkAvailability(
          professionalId,
          scheduledAt,
          durationMinutes,
          selectedAppointment.id
        );

        if (result.success) {
          const isAvailable = result.data || false;
          setAvailabilityStatus({
            isAvailable,
            message: isAvailable
              ? 'Horário disponível'
              : 'Horário não disponível. Você pode agendar mesmo assim se desejar.',
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
  }, [professionalId, date, time, durationMinutes, selectedAppointment, checkAvailability]);

  // Agrupa agendamentos por profissional
  const professionalAppointments = useMemo(() => {
    if (!appointments) return new Map<string, Appointment[]>();

    const groupedMap = new Map<string, Appointment[]>();

    appointments.forEach((appointment) => {
      const profId = appointment.professional.id;
      const existing = groupedMap.get(profId) || [];
      groupedMap.set(profId, [...existing, appointment]);
    });

    // Ordena agendamentos por data (mais recentes primeiro)
    groupedMap.forEach((appts, key) => {
      groupedMap.set(
        key,
        appts.sort((a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        )
      );
    });

    return groupedMap;
  }, [appointments]);

  // Filtra apenas profissionais que possuem agendamentos
  const professionalsWithAppointments = useMemo(() => {
    return professionals.filter(
      (prof) => professionalAppointments.has(prof.id) &&
                (professionalAppointments.get(prof.id)?.length ?? 0) > 0
    );
  }, [professionals, professionalAppointments]);

  // Funções auxiliares
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
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

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDENTE: { label: 'Pendente', variant: 'secondary' },
      PAGO: { label: 'Pago', variant: 'default' },
      CANCELADO: { label: 'Cancelado', variant: 'destructive' },
    };

    const config = variants[status] || variants.PENDENTE;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Toggle dropdown
  const toggleProfessional = (professionalId: string) => {
    setExpandedProfessionals((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(professionalId)) {
        newSet.delete(professionalId);
      } else {
        newSet.add(professionalId);
      }
      return newSet;
    });
  };

  // Handlers dos dialogs
  const handleView = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setViewDialogOpen(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    const scheduledDate = new Date(appointment.scheduledAt);
    reset({
      professionalId: appointment.professional.id,
      roomId: appointment.room?.id,
      date: scheduledDate,
      time: format(scheduledDate, 'HH:mm'),
      durationMinutes: appointment.durationMinutes,
      observations: appointment.observations || '',
    });
    setAvailabilityStatus(null);
    setEditDialogOpen(true);
  };

  const handleDelete = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDeleteDialogOpen(true);
  };

  const onSubmitEdit = async (data: EditAppointmentFormData) => {
    if (!selectedAppointment) return;

    try {
      const scheduledAt = `${format(data.date, 'yyyy-MM-dd')}T${data.time}:00`;

      const updateData: UpdateAppointmentRequest = {
        professionalId: data.professionalId,
        roomId: data.roomId,
        scheduledAt,
        durationMinutes: data.durationMinutes,
        observations: data.observations,
      };

      await updateAppointment(selectedAppointment.id, updateData);
      setEditDialogOpen(false);
      setSelectedAppointment(null);
      refetch();
    } catch (error) {
      // Erro tratado no hook
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedAppointment) return;

    setIsDeleting(true);
    try {
      const result = await cancelAppointmentAction(selectedAppointment.id, 'Cancelado pelo usuário');

      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        toast.success('Agendamento cancelado com sucesso!');
        setDeleteDialogOpen(false);
        setSelectedAppointment(null);
        refetch();
      } else {
        toast.error(result.error || 'Erro ao cancelar agendamento');
      }
    } catch (error) {
      toast.error('Erro ao cancelar agendamento');
    } finally {
      setIsDeleting(false);
    }
  };

  // Gerar opções de horário (7h às 20h, intervalo de 15 minutos)
  const timeSlots = [];
  for (let hour = 7; hour < 20; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(timeStr);
    }
  }

  if (isLoading) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
        Carregando agendamentos...
      </Card>
    );
  }

  if (professionalsWithAppointments.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Nenhum profissional possui agendamentos no momento.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="p-4 border-b">
          <h3 className="font-semibold">Agendamentos por Profissional</h3>
          <p className="text-sm text-muted-foreground">
            {professionalsWithAppointments.length} profissional(is) com agendamentos
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Profissional</TableHead>
              <TableHead>Especialidade</TableHead>
              <TableHead className="text-right">Agendamentos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {professionalsWithAppointments.map((professional) => {
              const appts = professionalAppointments.get(professional.id) || [];
              const isExpanded = expandedProfessionals.has(professional.id);

              return (
                <React.Fragment key={professional.id}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleProfessional(professional.id)}
                  >
                    <TableCell>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(professional.user.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{professional.user.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{SPECIALTY_LABELS[professional.specialty] || professional.specialty}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{appts.length}</Badge>
                    </TableCell>
                  </TableRow>

                  {/* Lista de agendamentos expandida */}
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={4} className="p-0">
                        <div className="bg-muted/30 border-t">
                          <div className="divide-y">
                            {appts.map((appointment) => (
                              <div
                                key={appointment.id}
                                className="flex items-center justify-between px-6 py-3 hover:bg-muted/50"
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="flex items-center gap-2 min-w-[140px]">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      {format(new Date(appointment.scheduledAt), 'dd/MM/yyyy')}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 min-w-[80px]">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      {format(new Date(appointment.scheduledAt), 'HH:mm')}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-1">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium truncate">
                                      {appointment.patient.fullName}
                                    </span>
                                  </div>
                                  <div className="min-w-[100px]">
                                    {getStatusBadge(appointment.status)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleView(appointment);
                                    }}
                                    title="Visualizar"
                                  >
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(appointment);
                                    }}
                                    title="Editar"
                                    disabled={appointment.status === 'CANCELADO' || appointment.status === 'FINALIZADO'}
                                  >
                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(appointment);
                                    }}
                                    title="Cancelar"
                                    disabled={appointment.status === 'CANCELADO' || appointment.status === 'FINALIZADO'}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog de visualização */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Detalhes do Agendamento
            </DialogTitle>
            <DialogDescription>
              Informações completas sobre o agendamento selecionado.
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  {getStatusBadge(selectedAppointment.status)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Pagamento:</span>
                  {getPaymentStatusBadge(selectedAppointment.paymentStatus)}
                </div>
              </div>

              <Separator />

              {/* Informações de Data/Hora */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Data e Hora</p>
                    <p className="text-sm text-muted-foreground">
                      {format(
                        new Date(selectedAppointment.scheduledAt),
                        "EEEE, dd 'de' MMMM 'de' yyyy",
                        { locale: ptBR }
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedAppointment.scheduledAt), 'HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Duração</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAppointment.durationMinutes} minutos
                    </p>
                    {selectedAppointment.durationActualMinutes && (
                      <p className="text-sm text-muted-foreground">
                        Real: {selectedAppointment.durationActualMinutes} min
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Paciente e Profissional */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Paciente</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAppointment.patient.fullName}
                    </p>
                    {selectedAppointment.patient.email && (
                      <p className="text-sm text-muted-foreground">
                        {selectedAppointment.patient.email}
                      </p>
                    )}
                    {selectedAppointment.patient.phone && (
                      <p className="text-sm text-muted-foreground">
                        {selectedAppointment.patient.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Stethoscope className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Profissional</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAppointment.professional.user.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {SPECIALTY_LABELS[selectedAppointment.professional.specialty] || selectedAppointment.professional.specialty}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sala */}
              {selectedAppointment.room && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Sala</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedAppointment.room.name}
                      </p>
                      {selectedAppointment.room.description && (
                        <p className="text-sm text-muted-foreground">
                          {selectedAppointment.room.description}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Valor */}
              <Separator />
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Valor Total</p>
                  <p className="text-lg font-semibold text-primary">
                    {formatCurrency(selectedAppointment.totalValue)}
                  </p>
                  {selectedAppointment.paymentMethod && (
                    <p className="text-sm text-muted-foreground">
                      Método: {selectedAppointment.paymentMethod}
                    </p>
                  )}
                </div>
              </div>

              {/* Procedimentos */}
              {selectedAppointment.procedures && selectedAppointment.procedures.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="font-medium mb-2">Procedimentos</p>
                    <div className="space-y-2">
                      {selectedAppointment.procedures.map((procedure) => (
                        <div
                          key={procedure.id}
                          className="flex items-center justify-between text-sm p-2 bg-muted rounded-md"
                        >
                          <span>{procedure.name}</span>
                          <span className="text-muted-foreground">
                            {procedure.quantity}x - {formatCurrency(procedure.totalValue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Observações */}
              {selectedAppointment.observations && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Observações</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedAppointment.observations}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Data de criação */}
              <Separator />
              <div className="text-xs text-muted-foreground">
                Criado em:{' '}
                {format(
                  new Date(selectedAppointment.createdAt),
                  "dd/MM/yyyy 'às' HH:mm",
                  { locale: ptBR }
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Agendamento
            </DialogTitle>
            <DialogDescription>
              Altere as informações do agendamento.
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
              {/* Paciente (não editável) */}
              <div className="space-y-2">
                <Label>Paciente</Label>
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedAppointment.patient.fullName}</span>
                </div>
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
                    ) : allProfessionals && allProfessionals.length > 0 ? (
                      allProfessionals.map((professional) => (
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

              {/* Data e Horário */}
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
                        <Calendar className="mr-2 h-4 w-4" />
                        {date ? format(date, 'dd/MM/yyyy') : 'Selecione'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
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
                    <SelectContent className="max-h-[200px]">
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
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="text-sm">{availabilityStatus.message}</span>
                </div>
              )}

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  {...register('observations')}
                  placeholder="Informações adicionais..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Cancelar Agendamento"
        description={`Tem certeza que deseja cancelar o agendamento de ${selectedAppointment?.patient.fullName}? Esta ação não pode ser desfeita.`}
        confirmText="Cancelar Agendamento"
        cancelText="Voltar"
        variant="destructive"
        isLoading={isDeleting}
      />

      {/* Dialog de conflito */}
      <ConflictDialog
        open={!!pendingConflict}
        message={pendingConflict?.error || ''}
        onConfirm={confirmConflict}
        onCancel={cancelConflict}
        isLoading={isUpdating}
      />
    </div>
  );
}
