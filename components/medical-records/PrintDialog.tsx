'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, FileDown, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { MedicalDocument } from '@/actions/memed-actions';

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  PRESCRICAO:          'Receituário Comum',
  PRESCRICAO_ESPECIAL: 'Receituário Especial',
  SOLICITACAO_EXAME:   'Solicitação de Exame / Encaminhamento',
  ATESTADO:            'Atestado Médico',
  RECEITA:             'Receituário',
  LAUDO:               'Laudo',
  RELATORIO:           'Relatório',
};

interface PrintDialogProps {
  open: boolean;
  onClose: () => void;
  medicalRecordId: string | null;
  memedDocuments: MedicalDocument[];
  loadingDocuments: boolean;
}

export function PrintDialog({
  open,
  onClose,
  medicalRecordId,
  memedDocuments,
  loadingDocuments,
}: PrintDialogProps) {
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    if (!medicalRecordId) return;
    setExportingPdf(true);
    try {
      const res = await fetch(`/api/medical-records/${medicalRecordId}/pdf`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || 'Erro ao gerar PDF');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prontuario-${medicalRecordId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF gerado com sucesso');
    } catch {
      toast.error('Erro ao gerar PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Imprimir / Exportar Documentos</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Prontuário */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Prontuário
            </p>
            <div className="flex items-center justify-between border rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium">Prontuário Completo</p>
                  <p className="text-xs text-muted-foreground">
                    {medicalRecordId
                      ? 'Exporta o prontuário preenchido em PDF'
                      : 'Salve o prontuário antes de exportar'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPdf}
                disabled={!medicalRecordId || exportingPdf}
              >
                {exportingPdf ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="mr-2 h-4 w-4" />
                )}
                Exportar PDF
              </Button>
            </div>
          </div>

          <Separator />

          {/* Documentos Memed */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Documentos Médicos (Memed)
            </p>

            {loadingDocuments ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Carregando documentos...</span>
              </div>
            ) : memedDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                Nenhum documento gerado neste atendimento.
              </p>
            ) : (
              <div className="border rounded-lg divide-y">
                {memedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between px-4 py-3 gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(doc.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild className="shrink-0">
                      <a
                        href={doc.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Abrir
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
