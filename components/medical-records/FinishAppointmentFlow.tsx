'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  CheckCircle2,
  User,
  Stethoscope,
  ClipboardList,
  Banknote,
  CreditCard,
  QrCode,
  FileText,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { PaymentStatus, PaymentMethod } from '@/types/financial.types';
import type { Appointment } from '@/types/appointment.types';
import { SPECIALTY_LABELS } from '@/types/professional.types';
import type { VitalSigns } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string; description: string }[] = [
  { value: PaymentStatus.PAGO, label: 'Pago', description: 'Pagamento recebido agora' },
  { value: PaymentStatus.PENDENTE, label: 'Pendente', description: 'Pagamento ainda não realizado' },
  { value: PaymentStatus.FIADO, label: 'Fiado', description: 'Acerto posterior combinado' },
];

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: PaymentMethod.PIX, label: 'PIX', icon: <QrCode className="h-4 w-4" /> },
  { value: PaymentMethod.DINHEIRO, label: 'Dinheiro', icon: <Banknote className="h-4 w-4" /> },
  { value: PaymentMethod.DEBITO, label: 'Débito', icon: <CreditCard className="h-4 w-4" /> },
  { value: PaymentMethod.CREDITO, label: 'Crédito', icon: <CreditCard className="h-4 w-4" /> },
  { value: PaymentMethod.BOLETO, label: 'Boleto', icon: <FileText className="h-4 w-4" /> },
  { value: PaymentMethod.OUTRO, label: 'Outro', icon: <Banknote className="h-4 w-4" /> },
];

/** Converte chave do conteúdo (ex: queixa_principal) em label legível */
function fieldLabel(key: string): string {
  const labels: Record<string, string> = {
    queixa_principal: 'Queixa principal',
    anamnese: 'Anamnese',
    exame_fisico: 'Exame físico',
    hipotese_diagnostica: 'Hipótese diagnóstica',
    prescricoes: 'Prescrições',
    solicitacao_encaminhamento: 'Solicitação de encaminhamento',
    observacoes: 'Observações',
    evolucao: 'Evolução',
  };
  return labels[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatVitalSigns(v: VitalSigns): string[] {
  const lines: string[] = [];
  if (v.bloodPressure) lines.push(`PA: ${v.bloodPressure}`);
  if (v.heartRate != null) lines.push(`FC: ${v.heartRate} bpm`);
  if (v.temperature != null) lines.push(`Temp: ${v.temperature}°C`);
  if (v.oxygenSaturation != null) lines.push(`SpO2: ${v.oxygenSaturation}%`);
  if (v.weight != null) lines.push(`Peso: ${v.weight} kg`);
  if (v.height != null) lines.push(`Altura: ${v.height} cm`);
  if (v.imc != null) lines.push(`IMC: ${v.imc}`);
  return lines;
}

export interface FinishAppointmentFlowProps {
  appointment: Appointment;
  medicalRecordContent?: Record<string, unknown>;
  vitalSigns?: VitalSigns | null;
  onConfirm: (paymentStatus: PaymentStatus, paymentMethod?: PaymentMethod) => void;
  onCancel: () => void;
  isPending: boolean;
}

const STEPS = [
  { id: 1, title: 'Resumo e pagamento', icon: ClipboardList },
  { id: 2, title: 'Revisão dos dados', icon: FileText },
];

export function FinishAppointmentFlow({
  appointment,
  medicalRecordContent = {},
  vitalSigns,
  onConfirm,
  onCancel,
  isPending,
}: FinishAppointmentFlowProps) {
  const [step, setStep] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PAGO);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.PIX);

  const { patient, professional, procedures = [], totalValue } = appointment;

  const handleConfirm = () => {
    onConfirm(
      paymentStatus,
      paymentStatus === PaymentStatus.PAGO ? paymentMethod : undefined
    );
  };

  const hasContent = Object.keys(medicalRecordContent).length > 0;
  const vitalLines = vitalSigns ? formatVitalSigns(vitalSigns) : [];

  return (
    <div className="space-y-6">
      {/* Indicador de steps */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => !isPending && setStep(s.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                step === s.id
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border hover:bg-muted'
              )}
            >
              <s.icon className="h-4 w-4" />
              {s.title}
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Resumo do atendimento */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Sinais vitais */}
          {vitalLines.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Sinais vitais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  {vitalLines.map((line, i) => (
                    <span key={i}>{line}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campos preenchidos no prontuário */}
          {hasContent && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Resumo do prontuário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  {Object.entries(medicalRecordContent).map(([key, value]) => {
                    if (value == null || value === '') return null;
                    const str =
                      typeof value === 'string'
                        ? value
                        : typeof value === 'boolean'
                          ? value
                            ? 'Sim'
                            : 'Não'
                          : Array.isArray(value)
                            ? value.join(', ')
                            : String(value);
                    const preview = str.length > 200 ? `${str.slice(0, 200)}...` : str;
                    return (
                      <li key={key} className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                        <span className="font-medium text-foreground">{fieldLabel(key)}</span>
                        <p className="mt-0.5 text-muted-foreground whitespace-pre-wrap">{preview}</p>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Procedimentos realizados */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Procedimentos realizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {procedures.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum procedimento registrado.</p>
              ) : (
                <ul className="space-y-2">
                  {procedures.map((p) => (
                    <li
                      key={p.id}
                      className="flex justify-between text-sm"
                    >
                      <span>{p.name}</span>
                      <span className="text-muted-foreground">
                        {p.quantity > 1 ? `${p.quantity} × ` : ''}
                        {p.totalValue.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </li>
                  ))}
                  <li className="flex justify-between font-semibold pt-2 border-t">
                    <span>Total</span>
                    <span>
                      {totalValue.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </li>
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Meios de pagamento — primeira tela */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Status do pagamento</p>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentStatus(opt.value)}
                      className={cn(
                        'flex flex-col items-center rounded-lg border p-3 text-center transition-colors',
                        paymentStatus === opt.value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:bg-muted'
                      )}
                    >
                      <span className="text-sm font-medium">{opt.label}</span>
                      <span className="mt-0.5 text-xs text-muted-foreground leading-tight">
                        {opt.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {paymentStatus === PaymentStatus.PAGO && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Forma de pagamento</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PAYMENT_METHOD_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPaymentMethod(opt.value)}
                        className={cn(
                          'flex items-center justify-center gap-1.5 rounded-lg border p-2.5 text-sm transition-colors',
                          paymentMethod === opt.value
                            ? 'border-primary bg-primary/5 text-primary font-medium'
                            : 'border-border hover:bg-muted'
                        )}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onCancel} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={() => setStep(2)} disabled={isPending} className="bg-success hover:bg-success/90 text-success-foreground">
              Próximo — Revisar dados
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Revisão — apenas visualização de todos os dados */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Dados do paciente */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Paciente
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium">{patient.fullName}</p>
                {patient.phone && <p className="text-muted-foreground">{patient.phone}</p>}
                {patient.healthPlan && (
                  <p className="text-muted-foreground">Plano: {patient.healthPlan}</p>
                )}
              </CardContent>
            </Card>

            {/* Dados do profissional */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Profissional
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium">
                  {professional?.user?.fullName ?? professional?.user?.email ?? '—'}
                </p>
                {professional?.specialty && (
                  <p className="text-muted-foreground">
                    {SPECIALTY_LABELS[professional.specialty as keyof typeof SPECIALTY_LABELS] ?? professional.specialty}
                  </p>
                )}
                {appointment.scheduledAt && (
                  <p className="text-muted-foreground">
                    {format(new Date(appointment.scheduledAt), "EEEE, d 'de' MMMM 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Procedimentos e valor */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Procedimentos e valor</CardTitle>
            </CardHeader>
            <CardContent>
              {procedures.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum procedimento.</p>
              ) : (
                <ul className="space-y-2">
                  {procedures.map((p) => (
                    <li key={p.id} className="flex justify-between text-sm">
                      <span>{p.name}</span>
                      <span>
                        {p.totalValue.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Separator className="my-3" />
              <div className="flex justify-between font-semibold text-base">
                <span>Total da consulta</span>
                <span>
                  {totalValue.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Resumo do pagamento (somente leitura) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">
                {PAYMENT_STATUS_OPTIONS.find((o) => o.value === paymentStatus)?.label ?? paymentStatus}
                {paymentStatus === PaymentStatus.PAGO && (
                  <span className="text-muted-foreground font-normal">
                    {' '}
                    · {PAYMENT_METHOD_OPTIONS.find((o) => o.value === paymentMethod)?.label ?? paymentMethod}
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-between gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              disabled={isPending}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isPending}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Confirmar finalização
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
