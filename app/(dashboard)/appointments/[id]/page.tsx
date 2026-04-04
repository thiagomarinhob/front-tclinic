'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  DollarSign,
  FileText,
  Stethoscope,
  ArrowLeft,
  Edit,
  CheckCircle,
  XCircle,
  Play,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAppointment } from '@/hooks/useAppointments';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { Appointment } from '@/types';
import { SPECIALTY_LABELS } from '@/types';

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;

  const { data: appointment, isLoading } = useAppointment(appointmentId);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      AGENDADO: { label: 'Agendado', variant: 'default' },
      CONFIRMADO: { label: 'Confirmado', variant: 'default' },
      EM_ATENDIMENTO: { label: 'Em Atendimento', variant: 'secondary' },
      FINALIZADO: { label: 'Finalizado', variant: 'outline' },
      CANCELADO: { label: 'Cancelado', variant: 'destructive' },
      NAO_COMPARECEU: { label: 'Nao Compareceu', variant: 'secondary' },
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!appointment) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Atendimento não encontrado.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detalhes do Atendimento</h1>
            <p className="text-muted-foreground">
              Visualize as informações completas do atendimento
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(appointment.status)}
          {getPaymentStatusBadge(appointment.paymentStatus)}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Informacoes principais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Informações do Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Data</p>
                  <p className="text-sm text-muted-foreground">
                    {format(
                      new Date(appointment.scheduledAt),
                      "EEEE, dd 'de' MMMM 'de' yyyy",
                      { locale: ptBR }
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Horario</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(appointment.scheduledAt), 'HH:mm')} - Duracao: {appointment.durationMinutes} min
                  </p>
                </div>
              </div>
            </div>

            {appointment.room && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Sala</p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.room.name}
                    {appointment.room.description && ` - ${appointment.room.description}`}
                  </p>
                </div>
              </div>
            )}

            {appointment.observations && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Observacoes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {appointment.observations}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paciente e Profissional */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Participantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Paciente</p>
                <p className="text-sm text-muted-foreground">
                  {appointment.patient.fullName}
                </p>
                {appointment.patient.email && (
                  <p className="text-sm text-muted-foreground">
                    {appointment.patient.email}
                  </p>
                )}
                {appointment.patient.phone && (
                  <p className="text-sm text-muted-foreground">
                    {appointment.patient.phone}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Stethoscope className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Profissional</p>
                <p className="text-sm text-muted-foreground">
                  {appointment.professional.user.fullName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {SPECIALTY_LABELS[appointment.professional.specialty] || appointment.professional.specialty}
                </p>
                <p className="text-sm text-muted-foreground">
                  {appointment.professional.documentType}: {appointment.professional.documentNumber}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Valor e Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Informacoes Financeiras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Valor Total</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(appointment.totalValue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status do Pagamento</span>
              {getPaymentStatusBadge(appointment.paymentStatus)}
            </div>
            {appointment.paymentMethod && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Metodo de Pagamento</span>
                <span>{appointment.paymentMethod}</span>
              </div>
            )}
            {appointment.paidAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pago em</span>
                <span>
                  {format(new Date(appointment.paidAt), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Procedimentos */}
        {appointment.procedures && appointment.procedures.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Procedimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {appointment.procedures.map((procedure) => (
                  <div
                    key={procedure.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-md"
                  >
                    <div>
                      <p className="font-medium">{procedure.name}</p>
                      {procedure.description && (
                        <p className="text-sm text-muted-foreground">
                          {procedure.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {procedure.quantity}x {formatCurrency(procedure.value)}
                      </p>
                      <p className="font-medium">
                        {formatCurrency(procedure.totalValue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer com data de criacao */}
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground text-center">
            Atendimento criado em{' '}
            {format(new Date(appointment.createdAt), "dd/MM/yyyy 'as' HH:mm", {
              locale: ptBR,
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
