'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, FileDown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getMedicalRecordByIdAction } from '@/actions/medical-record-actions';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { MedicalRecord } from '@/types';

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

export default function MedicalRecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recordId = params.id as string;

  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    if (!recordId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMedicalRecordByIdAction(recordId)
      .then((result) => {
        if (cancelled) return;
        if (result.success && result.data) {
          setRecord(result.data);
        } else {
          setError(result.error ?? 'Prontuário não encontrado');
          setRecord(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [recordId]);

  const handleExportPdf = async () => {
    if (!recordId) return;
    setExportingPdf(true);
    try {
      const res = await fetch(`/api/medical-records/${recordId}/pdf`, { credentials: 'include' });
      if (!res.ok) {
        const text = await res.text();
        let msg = 'Erro ao gerar PDF';
        try {
          const json = JSON.parse(text);
          msg = json.message || msg;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prontuario-${recordId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao exportar PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !record) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-8">
          <p className="text-destructive mb-4">{error ?? 'Prontuário não encontrado'}</p>
          <Button variant="outline" onClick={() => router.push('/medical-records')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  // Títulos em português para as chaves dos sinais vitais
  const vitalSignsLabels: Record<string, string> = {
    bloodPressure: 'Pressão arterial',
    heartRate: 'Frequência cardíaca',
    temperature: 'Temperatura',
    oxygenSaturation: 'Saturação de oxigênio',
    weight: 'Peso',
    height: 'Altura',
    imc: 'IMC',
  };

  const getVitalSignLabel = (key: string) =>
    vitalSignsLabels[key] ?? key.replace(/([A-Z])/g, ' $1').trim();

  // Apenas chaves que são dados reais (evita exibir propriedades internas de JsonNode se vierem da API)
  const isDataKey = (key: string) => {
    const k = key.toLowerCase();
    return !['array', 'boolean', 'bigdecimal', 'biginteger', 'binary', 'containernode', 'double', 'empty', 'float', 'floatingpointnumber', 'integralnumber', 'long', 'missingnode', 'nodetype', 'null', 'number', 'object', 'pojo', 'short', 'textual', 'valuenode'].includes(k);
  };

  const rawContent = record.content && typeof record.content === 'object' ? record.content : {};
  const content = Object.fromEntries(Object.entries(rawContent).filter(([key]) => isDataKey(key)));
  const contentEntries = Object.entries(content);

  const rawVitalSigns = record.vitalSigns && typeof record.vitalSigns === 'object' ? record.vitalSigns : {};
  const vitalSignsEntries = Object.entries(rawVitalSigns).filter(([key]) => isDataKey(key));

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/medical-records')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detalhes do Prontuário</h1>
            <p className="text-muted-foreground">ID: {record.id}</p>
          </div>
        </div>
        <Button
          onClick={handleExportPdf}
          disabled={exportingPdf}
          className="flex items-center gap-2"
        >
          {exportingPdf ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          Exportar PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informações gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Paciente</dt>
              <dd className="font-medium">{record.patientName ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Profissional</dt>
              <dd className="font-medium">{record.professionalName ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Criado em</dt>
              <dd>{formatDateTime(record.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Atualizado em</dt>
              <dd>{formatDateTime(record.updatedAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Assinado em</dt>
              <dd>{record.signedAt ? formatDateTime(record.signedAt) : '—'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {vitalSignsEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sinais vitais</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {vitalSignsEntries.map(([key, value]) => (
                <div key={key}>
                  <dt className="text-muted-foreground">{getVitalSignLabel(key)}</dt>
                  <dd>{value != null ? String(value) : '—'}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      {contentEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Conteúdo do prontuário</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              {contentEntries.map(([key, value]) => (
                <div key={key}>
                  <dt className="text-muted-foreground font-medium mb-1">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </dt>
                  <dd className="text-foreground whitespace-pre-wrap">
                    {value != null && typeof value === 'object'
                      ? JSON.stringify(value, null, 2)
                      : String(value ?? '—')}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      {contentEntries.length === 0 && vitalSignsEntries.length === 0 && (
        <Card className="p-6">
          <p className="text-muted-foreground text-sm">
            Nenhum conteúdo ou sinais vitais registrados neste prontuário.
          </p>
        </Card>
      )}
    </div>
  );
}
