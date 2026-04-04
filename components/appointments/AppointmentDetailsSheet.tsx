'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  DollarSign,
  FileText,
  Stethoscope,
  Edit,
  XCircle,
  Play,
  Loader2,
  ClipboardList,
  CheckCircle2,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { cancelAppointmentAction, saveTriageAction, startAppointmentAction } from '@/actions/appointment-actions';
import { formatCurrency } from '@/lib/utils';
import { useAuthContext } from '@/contexts/AuthContext';
import { TriageDialog } from './TriageDialog';
import type { Appointment, AppointmentStatus, VitalSigns } from '@/types';
import { SPECIALTY_LABELS, UserRole } from '@/types';

interface AppointmentDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onEdit?: (appointment: Appointment) => void;
  onSuccess?: () => void;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  AGENDADO: { label: 'Agendado', variant: 'default' },
  CONFIRMADO: { label: 'Confirmado', variant: 'default' },
  EM_ATENDIMENTO: { label: 'Em Atendimento', variant: 'secondary' },
  FINALIZADO: { label: 'Finalizado', variant: 'outline' },
  CANCELADO: { label: 'Cancelado', variant: 'destructive' },
  NAO_COMPARECEU: { label: 'Nao Compareceu', variant: 'secondary' },
};

const paymentStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDENTE: { label: 'Pendente', variant: 'secondary' },
  PAGO: { label: 'Pago', variant: 'default' },
  CANCELADO: { label: 'Cancelado', variant: 'destructive' },
};

export function AppointmentDetailsSheet({
  open,
  onOpenChange,
  appointment,
  onEdit,
  onSuccess,
}: AppointmentDetailsSheetProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [triageDialogOpen, setTriageDialogOpen] = useState(false);
  const [viewTriageOpen, setViewTriageOpen] = useState(false);

  const cancelMutation = useMutation({
    mutationFn: async ({ appointmentId, reason }: { appointmentId: string; reason?: string }) => {
      const result = await cancelAppointmentAction(appointmentId, reason);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Agendamento cancelado com sucesso!');
      setCancelDialogOpen(false);
      setCancelReason('');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao cancelar agendamento');
    },
  });

  const triageMutation = useMutation({
    mutationFn: async ({ appointmentId, vitalSigns }: { appointmentId: string; vitalSigns: VitalSigns }) => {
      const result = await saveTriageAction(appointmentId, vitalSigns);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment'] });
      toast.success('Triagem salva com sucesso!');
      setTriageDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao salvar triagem');
    },
  });

  const startMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const result = await startAppointmentAction(appointmentId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (_, appointmentId) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
      toast.success('Atendimento iniciado!');
      onOpenChange(false);
      router.push(`/appointments/${appointmentId}/medical-record`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao iniciar atendimento');
    },
  });

  const handleStartAppointment = () => {
    if (appointment) {
      startMutation.mutate(appointment.id);
    }
  };

  const handleTriageConfirm = (data: VitalSigns | null) => {
    if (!appointment || !data) return;
    triageMutation.mutate({ appointmentId: appointment.id, vitalSigns: data });
  };

  if (!appointment) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.AGENDADO;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const config = paymentStatusConfig[status] || paymentStatusConfig.PENDENTE;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };


  const handleCancelAppointment = () => {
    cancelMutation.mutate({ appointmentId: appointment.id, reason: cancelReason || undefined });
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(appointment);
    }
    onOpenChange(false);
  };

  const isAssignedProfessional = appointment.professional.user.id === user?.id;
  const canCancel = !['CANCELADO', 'FINALIZADO'].includes(appointment.status);
  const canStart = ['AGENDADO', 'CONFIRMADO'].includes(appointment.status) && user?.role === UserRole.PROFISSIONAL_SAUDE && isAssignedProfessional;
  const canReturnToAppointment = appointment.status === 'EM_ATENDIMENTO' && user?.role === UserRole.PROFISSIONAL_SAUDE && isAssignedProfessional;
  const canEdit = !['CANCELADO', 'FINALIZADO'].includes(appointment.status);
  const canTriage = ['AGENDADO', 'CONFIRMADO'].includes(appointment.status) && user?.role !== UserRole.PROFISSIONAL_SAUDE;
  const hasVitalSigns = appointment.vitalSigns && Object.keys(appointment.vitalSigns).length > 0;

  const handleReturnToAppointment = () => {
    onOpenChange(false);
    router.push(`/appointments/${appointment.id}/medical-record`);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
          <SheetHeader className="p-6 pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Detalhes do Agendamento
              </SheetTitle>
            </div>
            <SheetDescription className="flex items-center gap-2 pt-2">
              {getStatusBadge(appointment.status)}
              {getPaymentStatusBadge(appointment.paymentStatus)}
              {hasVitalSigns && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Triagem
                </Badge>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6">
            <div className="space-y-6 pb-6">
              {/* Data e Horario */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data e Horario
                </h3>
                <div className="space-y-2 pl-6">
                  <div>
                    <p className="font-medium">
                      {format(
                        new Date(appointment.scheduledAt),
                        "EEEE, dd 'de' MMMM 'de' yyyy",
                        { locale: ptBR }
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(new Date(appointment.scheduledAt), 'HH:mm')} - Duracao: {appointment.durationMinutes} min
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Paciente */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Paciente
                </h3>
                <div className="space-y-1 pl-6">
                  <p className="font-medium">{appointment.patient.fullName}</p>
                  {appointment.patient.email && (
                    <p className="text-sm text-muted-foreground">{appointment.patient.email}</p>
                  )}
                  {appointment.patient.phone && (
                    <p className="text-sm text-muted-foreground">{appointment.patient.phone}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Profissional */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Profissional
                </h3>
                <div className="space-y-1 pl-6">
                  <p className="font-medium">{appointment.professional.user.fullName}</p>
                  <p className="text-sm text-muted-foreground">{SPECIALTY_LABELS[appointment.professional.specialty] || appointment.professional.specialty}</p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.professional.documentType}: {appointment.professional.documentNumber}
                  </p>
                </div>
              </div>

              {/* Sala */}
              {appointment.room && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Sala
                    </h3>
                    <div className="pl-6">
                      <p className="font-medium">{appointment.room.name}</p>
                      {appointment.room.description && (
                        <p className="text-sm text-muted-foreground">{appointment.room.description}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Valor */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Informacoes Financeiras
                </h3>
                <div className="space-y-2 pl-6">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Valor Total</span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(appointment.totalValue)}
                    </span>
                  </div>
                  {appointment.paymentMethod && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Metodo</span>
                      <span className="text-sm">{appointment.paymentMethod}</span>
                    </div>
                  )}
                  {appointment.paidAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Pago em</span>
                      <span className="text-sm">
                        {format(new Date(appointment.paidAt), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Procedimentos */}
              {appointment.procedures && appointment.procedures.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground">
                      Procedimentos
                    </h3>
                    <div className="space-y-2 pl-6">
                      {appointment.procedures.map((procedure) => (
                        <div
                          key={procedure.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-md"
                        >
                          <div>
                            <p className="font-medium text-sm">{procedure.name}</p>
                            {procedure.description && (
                              <p className="text-xs text-muted-foreground">
                                {procedure.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {procedure.quantity}x {formatCurrency(procedure.value)}
                            </p>
                            <p className="font-medium text-sm">
                              {formatCurrency(procedure.totalValue)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Observacoes */}
              {appointment.observations && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Observacoes
                    </h3>
                    <div className="pl-6">
                      <p className="text-sm whitespace-pre-wrap">{appointment.observations}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Motivo do cancelamento */}
              {appointment.status === 'CANCELADO' && appointment.cancellationReason && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-destructive flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Motivo do Cancelamento
                    </h3>
                    <div className="pl-6">
                      <p className="text-sm whitespace-pre-wrap">{appointment.cancellationReason}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <SheetFooter className="p-6 pt-4 border-t flex-shrink-0">
            <div className="flex flex-col gap-3 w-full">
              {/* Botao principal - Iniciar Atendimento (profissional) */}
              {canStart && (
                <Button
                  onClick={handleStartAppointment}
                  disabled={startMutation.isPending}
                  className="w-full bg-success hover:bg-success/90 text-success-foreground"
                  size="lg"
                >
                  {startMutation.isPending ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-5 w-5" />
                  )}
                  Iniciar Atendimento
                </Button>
              )}

              {/* Botao principal - Voltar para o atendimento (quando já em andamento) */}
              {canReturnToAppointment && (
                <Button
                  onClick={handleReturnToAppointment}
                  className="w-full bg-success hover:bg-success/90 text-success-foreground"
                  size="lg"
                >
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Voltar para o Atendimento
                </Button>
              )}

              {/* Visualizar triagem (qualquer perfil, quando já existe triagem) */}
              {hasVitalSigns && (
                <Button
                  onClick={() => setViewTriageOpen(true)}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Eye className="mr-2 h-5 w-5" />
                  Visualizar Triagem
                </Button>
              )}

              {/* Editar / inserir triagem (não-profissionais) */}
              {canTriage && (
                <Button
                  onClick={() => setTriageDialogOpen(true)}
                  variant={hasVitalSigns ? 'outline' : 'default'}
                  className="w-full"
                  size="lg"
                  disabled={triageMutation.isPending}
                >
                  {triageMutation.isPending ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <ClipboardList className="mr-2 h-5 w-5" />
                  )}
                  {hasVitalSigns ? 'Editar dados de Triagem' : 'Inserir dados de Triagem'}
                </Button>
              )}

              {/* Botoes secundarios */}
              <div className="flex items-center gap-3">
                {canEdit && (
                  <Button
                    variant="outline"
                    onClick={handleEdit}
                    className="flex-1"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                )}
                {canCancel && (
                  <Button
                    variant="outline"
                    onClick={() => setCancelDialogOpen(true)}
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4 text-destructive" />
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Dialog de visualização de triagem (somente leitura) */}
      <TriageDialog
        open={viewTriageOpen}
        onOpenChange={setViewTriageOpen}
        onConfirm={() => {}}
        initialData={appointment.vitalSigns ?? undefined}
        readOnly
      />

      {/* Dialog de edição / inserção de triagem */}
      <TriageDialog
        open={triageDialogOpen}
        onOpenChange={setTriageDialogOpen}
        onConfirm={handleTriageConfirm}
        initialData={appointment.vitalSigns ?? undefined}
      />

      {/* Dialog de confirmacao de cancelamento */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este agendamento? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="cancelReason">Motivo do cancelamento (opcional)</Label>
            <Textarea
              id="cancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Informe o motivo do cancelamento..."
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancelAppointment();
              }}
              disabled={cancelMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
