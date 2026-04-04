'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAppointment } from '@/hooks/useAppointments';
import { useAuth } from '@/hooks/useAuth';
import { finishAppointmentAction } from '@/actions/appointment-actions';
import { PatientHeader } from './PatientHeader';
import { VitalSigns } from './VitalSigns';
import { QuickActions } from './QuickActions';
import { AddProceduresSection } from './AddProceduresSection';
import { ExamRequestDialog } from './ExamRequestDialog';
import { AtestadoDialog } from './AtestadoDialog';
import { MedicalRecordForm } from './MedicalRecordForm';
import { RecentHistory } from './RecentHistory';
import { HistoryDialog } from './HistoryDialog';
import { PrintDialog } from './PrintDialog';
import { AttachmentsDialog } from './AttachmentsDialog';
import { FinishAppointmentDialog } from './FinishAppointmentDialog';
import { PaymentStatus, PaymentMethod } from '@/types/financial.types';
import { MemedWidget } from '@/components/attendance/MemedWidget';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getMemedDocumentsAction } from '@/actions/memed-actions';
import { downloadReceitaPdf, downloadEncaminhamentoPdf } from '@/actions/document-actions';
import { saveMedicalRecordAction } from '@/actions/medical-record-actions';
import type { MedicalDocument } from '@/actions/memed-actions';
import type { VitalSigns as VitalSignsType, MedicalRecord } from '@/types';

interface MedicalRecordPageProps {
  appointmentId: string;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  PRESCRICAO:         'Receituário Comum',
  PRESCRICAO_ESPECIAL:'Receituário Especial',
  SOLICITACAO_EXAME:  'Solicitação de Exame / Encaminhamento',
  ATESTADO:           'Atestado Médico',
  RECEITA:            'Receituário',
  LAUDO:              'Laudo',
  RELATORIO:          'Relatório',
};

function formatDocumentType(type: string): string {
  return DOCUMENT_TYPE_LABELS[type] ?? type;
}

export function MedicalRecordPage({ appointmentId }: MedicalRecordPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: appointment, isLoading } = useAppointment(appointmentId);
  const { user } = useAuth();
  const tenantId = user?.clinicId ?? null;

  const [vitalSigns, setVitalSigns] = useState<VitalSignsType | null>(null);
  const [memedDocuments, setMemedDocuments] = useState<MedicalDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [showMemed, setShowMemed] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showExamRequest, setShowExamRequest] = useState(false);
  const [showAtestado, setShowAtestado] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  /** Snapshot do conteúdo do prontuário ao abrir o diálogo de finalização */
  const [finishDialogContent, setFinishDialogContent] = useState<Record<string, unknown>>({});
  const [medicalRecordId, setMedicalRecordId] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Conteúdo atual do formulário de prontuário (mesmo sem salvar)
  const medicalRecordContentRef = useRef<Record<string, unknown>>({});
  const selectedTemplateIdRef = useRef<string>('');

  const handleContentChange = useCallback((content: Record<string, unknown>) => {
    medicalRecordContentRef.current = content;
  }, []);

  const handleTemplateChange = useCallback((templateId: string) => {
    selectedTemplateIdRef.current = templateId;
  }, []);

  const memedSectionRef = useRef<HTMLDivElement>(null);

  const finishMutation = useMutation({
    mutationFn: async (payload: { paymentStatus: PaymentStatus; paymentMethod?: PaymentMethod }) => {
      const result = await finishAppointmentAction(appointmentId, payload);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      setShowFinishDialog(false);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
      toast.success('Atendimento finalizado com sucesso!');
      router.push('/appointments');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao finalizar atendimento');
    },
  });

  useEffect(() => {
    if (appointment?.vitalSigns && Object.keys(appointment.vitalSigns).length > 0) {
      setVitalSigns(appointment.vitalSigns);
      return;
    }

    const key = `triage-${appointmentId}`;
    const stored = sessionStorage.getItem(key);
    if (stored) {
      try {
        setVitalSigns(JSON.parse(stored) as VitalSignsType);
      } catch {
        // ignore
      }
    }
  }, [appointmentId, appointment?.vitalSigns]);

  // Carrega (ou recarrega) a lista de documentos do Memed
  const loadDocuments = useCallback(async () => {
    setLoadingDocuments(true);
    const result = await getMemedDocumentsAction(appointmentId);
    if (result.success && result.data) {
      setMemedDocuments(result.data);
    }
    setLoadingDocuments(false);
  }, [appointmentId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleRecordLoaded = useCallback((record: MedicalRecord) => {
    setMedicalRecordId(record.id);
    if (
      record.vitalSigns &&
      typeof record.vitalSigns === 'object' &&
      Object.keys(record.vitalSigns).length > 0
    ) {
      setVitalSigns((prev) => ({ ...prev, ...record.vitalSigns } as VitalSignsType));
    }
  }, []);


  const handlePrintClick = useCallback(async () => {
    const templateId = selectedTemplateIdRef.current;
    if (!templateId) {
      toast.error('Selecione um modelo de prontuário antes de imprimir');
      return;
    }
    setGeneratingPdf(true);
    const result = await saveMedicalRecordAction(
      appointmentId,
      templateId,
      medicalRecordContentRef.current,
      vitalSigns ?? undefined
    );
    setGeneratingPdf(false);
    if (!result.success) {
      toast.error(result.error || 'Erro ao salvar prontuário antes de imprimir');
      return;
    }
    if (result.data?.id) setMedicalRecordId(result.data.id);
    setShowPrint(true);
  }, [appointmentId, vitalSigns]);

  const handleReceitaClick = useCallback(async () => {
    const prescricoes = (medicalRecordContentRef.current['prescricoes'] as string) ?? '';
    if (!prescricoes.trim()) {
      toast.error('Preencha o campo "Prescrições" no prontuário antes de gerar a receita');
      return;
    }
    setGeneratingPdf(true);
    const result = await downloadReceitaPdf(appointmentId, prescricoes);
    setGeneratingPdf(false);
    if (!result.success) toast.error(result.error || 'Erro ao gerar receita');
    else toast.success('Receita gerada');
  }, [appointmentId]);

  const handleEncaminhamentoClick = useCallback(async () => {
    const encaminhamento = (medicalRecordContentRef.current['solicitacao_encaminhamento'] as string) ?? '';
    if (!encaminhamento.trim()) {
      toast.error('Preencha o campo "Solicitação de Encaminhamento" no prontuário antes de gerar o documento');
      return;
    }
    setGeneratingPdf(true);
    const result = await downloadEncaminhamentoPdf(appointmentId, encaminhamento);
    setGeneratingPdf(false);
    if (!result.success) toast.error(result.error || 'Erro ao gerar encaminhamento');
    else toast.success('Encaminhamento gerado');
  }, [appointmentId]);

  if (isLoading) return <LoadingSpinner />;

  if (!appointment) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Agendamento não encontrado</p>
      </Card>
    );
  }

  const professionalId = appointment.professional?.id ?? '';
  const canFinish = appointment.status === 'EM_ATENDIMENTO';

  return (
    <>
    <div className="flex gap-6 h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-auto space-y-6 pb-6">
        <PatientHeader appointment={appointment} />

        <VitalSigns
          appointmentId={appointmentId}
          value={vitalSigns}
          onChange={setVitalSigns}
        />

        <AddProceduresSection
          appointmentId={appointmentId}
          tenantId={tenantId}
          professionalId={appointment.professional?.id ?? null}
          currentProcedures={appointment.procedures ?? []}
          onHistoryClick={() => setShowHistory(true)}
        />

        <MedicalRecordForm
          appointmentId={appointmentId}
          tenantId={tenantId}
          professionalType={appointment.professional?.specialty ?? null}
          professionalId={appointment.professional?.id ?? null}
          vitalSigns={vitalSigns ?? undefined}
          onRecordLoaded={handleRecordLoaded}
          onContentChange={handleContentChange}
          onTemplateChange={handleTemplateChange}
        />

        <QuickActions
          appointmentId={appointmentId}
          professionalSpecialty={appointment.professional?.specialty ?? null}
          onReceitaClick={handleReceitaClick}
          onExamesClick={() => setShowExamRequest(true)}
          onAtestadoClick={() => setShowAtestado(true)}
          onEncaminhamentoClick={handleEncaminhamentoClick}
          onAttachmentsClick={() => setShowAttachments(true)}
          onPrintClick={handlePrintClick}
        />
        
        {/* ── Seção Memed ─────────────────────────────────────────── */}
        <div ref={memedSectionRef} className="space-y-4 scroll-mt-6">
          {/* Widget de prescrição */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documentos Médicos
                </CardTitle>
                <Button
                  variant={showMemed ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setShowMemed((v) => !v)}
                >
                  {showMemed ? 'Ocultar Memed' : 'Utilizar Memed'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Receituário comum e especial, solicitações de exame,
                encaminhamentos e atestados — gerados e assinados via Memed.
              </p>
            </CardHeader>
            <CardContent>
              {/* MemedWidget sempre montado (SDK inicializa em background); visibilidade controlada por showMemed */}
              {professionalId ? (
                <div className={showMemed ? '' : 'hidden'}>
                  <MemedWidget
                    appointmentId={appointmentId}
                    professionalId={professionalId}
                    patient={appointment.patient}
                    workplace={{
                      phone: appointment.professional?.user?.phone
                        ? Number(appointment.professional.user.phone.replace(/\D/g, ''))
                        : undefined,
                      cpf: appointment.professional?.user?.cpf ?? undefined,
                    }}
                    onDocumentSaved={loadDocuments}
                  />
                </div>
              ) : showMemed ? (
                <p className="text-sm text-muted-foreground">
                  Dados do profissional não disponíveis.
                </p>
              ) : null}
              {!showMemed && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Clique em <strong>Utilizar Memed</strong> para gerar receitas,
                  atestados e encaminhamentos digitais.
                </p>
              )}
            </CardContent>
          </Card>


        </div>
        {/* ── fim Seção Memed ──────────────────────────────────────── */}

        {/* ── Finalizar Atendimento ────────────────────────────────── */}
        {canFinish && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Atendimento em andamento. Finalize quando concluir a consulta.
              </p>
              <Button
                onClick={() => {
                  setFinishDialogContent({ ...medicalRecordContentRef.current });
                  setShowFinishDialog(true);
                }}
                disabled={finishMutation.isPending}
                className="bg-success hover:bg-success/90 text-success-foreground"
              >
                {finishMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Finalizar Atendimento
              </Button>
            </div>
          </Card>
        )}

      </div>

      <div className="w-96 overflow-auto">
        <RecentHistory patientId={appointment.patient.id} currentAppointmentId={appointmentId} />
      </div>
    </div>

    <HistoryDialog
      open={showHistory}
      onClose={() => setShowHistory(false)}
      patientId={appointment.patient.id}
      patientName={appointment.patient.fullName}
      currentAppointmentId={appointmentId}
    />

    <AttachmentsDialog
      open={showAttachments}
      onClose={() => setShowAttachments(false)}
      appointmentId={appointmentId}
    />

    <ExamRequestDialog
      open={showExamRequest}
      onClose={() => setShowExamRequest(false)}
      appointmentId={appointmentId}
    />

    <AtestadoDialog
      open={showAtestado}
      onClose={() => setShowAtestado(false)}
      appointmentId={appointmentId}
    />

    <PrintDialog
      open={showPrint}
      onClose={() => setShowPrint(false)}
      medicalRecordId={medicalRecordId}
      memedDocuments={memedDocuments}
      loadingDocuments={loadingDocuments}
    />

    <FinishAppointmentDialog
      open={showFinishDialog}
      onClose={() => setShowFinishDialog(false)}
      onConfirm={(paymentStatus, paymentMethod) => finishMutation.mutate({ paymentStatus, paymentMethod })}
      isPending={finishMutation.isPending}
      appointment={appointment}
      medicalRecordContent={finishDialogContent}
      vitalSigns={vitalSigns ?? undefined}
    />
    </>
  );
}
