'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getExamByIdAction,
  getPresignedUploadUrlAction,
  confirmExamResultUploadAction,
  getExamResultViewUrlAction,
  getPresignedRequestUploadUrlAction,
  confirmExamRequestUploadAction,
  getExamRequestViewUrlAction,
} from '@/actions/exam-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Loader2,
  Paperclip,
  Upload,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Exam, ExamStatus } from '@/types/exam.types';

const STATUS_LABELS: Record<ExamStatus, string> = {
  REQUESTED: 'Solicitado',
  PENDING_RESULT: 'Aguardando resultado',
  COMPLETED: 'Concluído',
};

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png';

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Upload de resultado
  const [uploadingResult, setUploadingResult] = useState(false);
  const [loadingResultUrl, setLoadingResultUrl] = useState(false);
  const resultFileInputRef = useRef<HTMLInputElement>(null);

  // Upload de solicitação
  const [uploadingRequest, setUploadingRequest] = useState(false);
  const [loadingRequestUrl, setLoadingRequestUrl] = useState(false);
  const requestFileInputRef = useRef<HTMLInputElement>(null);

  const loadExam = async () => {
    try {
      const result = await getExamByIdAction(examId);
      if (result.success && result.data) {
        setExam(result.data);
      } else {
        toast.error(result.error || 'Exame não encontrado');
        router.push('/exams');
      }
    } catch {
      toast.error('Erro ao carregar exame');
      router.push('/exams');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (examId) loadExam();
  }, [examId]);

  // ── Resultado ──────────────────────────────────────────────────────────────

  const handleResultFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !exam) return;

    setUploadingResult(true);
    try {
      const urlResult = await getPresignedUploadUrlAction(examId, file.name);
      if (!urlResult.success || !urlResult.data) {
        toast.error(urlResult.error || 'Erro ao obter URL de upload');
        return;
      }

      const putResponse = await fetch(urlResult.data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });

      if (!putResponse.ok) {
        toast.error('Falha no upload do arquivo. Tente novamente.');
        return;
      }

      const confirmResult = await confirmExamResultUploadAction(examId, urlResult.data.objectKey);
      if (confirmResult.success && confirmResult.data) {
        setExam(confirmResult.data);
        toast.success('Resultado anexado com sucesso.');
      } else {
        toast.error(confirmResult.error || 'Erro ao confirmar upload');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar arquivo');
    } finally {
      setUploadingResult(false);
      e.target.value = '';
    }
  };

  const handleViewResult = async () => {
    if (!exam?.resultFileKey) return;
    setLoadingResultUrl(true);
    try {
      const result = await getExamResultViewUrlAction(examId);
      if (result.success && result.data?.url) {
        window.open(result.data.url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error(result.error || 'Não foi possível abrir o resultado');
      }
    } catch {
      toast.error('Erro ao obter link do resultado');
    } finally {
      setLoadingResultUrl(false);
    }
  };

  // ── Solicitação ────────────────────────────────────────────────────────────

  const handleRequestFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !exam) return;

    setUploadingRequest(true);
    try {
      const urlResult = await getPresignedRequestUploadUrlAction(examId, file.name);
      if (!urlResult.success || !urlResult.data) {
        toast.error(urlResult.error || 'Erro ao obter URL de upload');
        return;
      }

      const putResponse = await fetch(urlResult.data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });

      if (!putResponse.ok) {
        toast.error('Falha no upload da solicitação. Tente novamente.');
        return;
      }

      const confirmResult = await confirmExamRequestUploadAction(examId, urlResult.data.objectKey);
      if (confirmResult.success && confirmResult.data) {
        setExam(confirmResult.data);
        toast.success('Solicitação anexada com sucesso.');
      } else {
        toast.error(confirmResult.error || 'Erro ao confirmar upload da solicitação');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar solicitação');
    } finally {
      setUploadingRequest(false);
      e.target.value = '';
    }
  };

  const handleViewRequest = async () => {
    if (!exam?.requestFileKey) return;
    setLoadingRequestUrl(true);
    try {
      const result = await getExamRequestViewUrlAction(examId);
      if (result.success && result.data?.url) {
        window.open(result.data.url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error(result.error || 'Não foi possível abrir a solicitação');
      }
    } catch {
      toast.error('Erro ao obter link da solicitação');
    } finally {
      setLoadingRequestUrl(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!exam) return null;

  const canUploadResult = exam.status === 'REQUESTED' || exam.status === 'PENDING_RESULT';
  const hasResult = exam.status === 'COMPLETED' && exam.resultFileKey;
  const hasRequest = !!exam.requestFileKey;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/exams">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">{exam.name}</h2>
              <Badge variant="secondary">{STATUS_LABELS[exam.status]}</Badge>
            </div>
            <p className="text-muted-foreground">
              Criado em {new Date(exam.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      {/* Dados do exame */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Dados do exame
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Nome</p>
            <p className="font-medium">{exam.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Paciente</p>
            <Link
              href={`/patients/${exam.patientId}`}
              className="font-medium text-primary hover:underline flex items-center gap-1"
            >
              <User className="h-4 w-4" />
              Ver paciente
            </Link>
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm text-muted-foreground">Indicação clínica</p>
            <p className="font-medium">{exam.clinicalIndication || '—'}</p>
          </div>

          {/* Solicitação médica */}
          <div className="sm:col-span-2 space-y-2">
            <p className="text-sm text-muted-foreground">Solicitação médica</p>
            <div className="flex flex-wrap gap-2">
              {hasRequest && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewRequest}
                  disabled={loadingRequestUrl}
                >
                  {loadingRequestUrl ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  Visualizar solicitação
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={uploadingRequest}
                onClick={() => requestFileInputRef.current?.click()}
              >
                {uploadingRequest ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Paperclip className="mr-2 h-4 w-4" />
                    {hasRequest ? 'Substituir solicitação' : 'Anexar solicitação'}
                  </>
                )}
              </Button>
              <input
                ref={requestFileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                className="hidden"
                onChange={handleRequestFileSelect}
                disabled={uploadingRequest}
              />
            </div>
            {!hasRequest && (
              <p className="text-xs text-muted-foreground">
                Nenhuma solicitação anexada.
              </p>
            )}
          </div>

          {exam.appointmentId && (
            <div>
              <p className="text-sm text-muted-foreground">Consulta</p>
              <Link
                href={`/appointments/${exam.appointmentId}`}
                className="font-medium text-primary hover:underline flex items-center gap-1"
              >
                <FileText className="h-4 w-4" />
                Ver consulta
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5" />
            Resultado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasResult && (
            <Button onClick={handleViewResult} disabled={loadingResultUrl}>
              {loadingResultUrl ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              Visualizar resultado
            </Button>
          )}

          {canUploadResult && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Envie o arquivo do resultado (PDF ou imagem). O upload é feito diretamente ao
                armazenamento e o exame será marcado como concluído.
              </p>
              <input
                ref={resultFileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                className="hidden"
                onChange={handleResultFileSelect}
                disabled={uploadingResult}
              />
              <Button
                variant="outline"
                disabled={uploadingResult}
                onClick={() => resultFileInputRef.current?.click()}
              >
                {uploadingResult ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar resultado
                  </>
                )}
              </Button>
            </div>
          )}

          {!hasResult && !canUploadResult && (
            <p className="text-sm text-muted-foreground">Nenhum resultado anexado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
