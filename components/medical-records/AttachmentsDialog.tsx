'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ExternalLink,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  getAttachmentUploadUrlAction,
  confirmAttachmentUploadAction,
  getAttachmentsByAppointmentAction,
  getAttachmentViewUrlAction,
  deleteAttachmentAction,
} from '@/actions/attachment-actions';
import type { AttachmentResponse } from '@/actions/attachment-actions';

interface AttachmentsDialogProps {
  open: boolean;
  onClose: () => void;
  appointmentId: string;
}

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsDialog({
  open,
  onClose,
  appointmentId,
}: AttachmentsDialogProps) {
  const [attachments, setAttachments] = useState<AttachmentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAttachments = useCallback(async () => {
    setLoading(true);
    const result = await getAttachmentsByAppointmentAction(appointmentId);
    if (result.success && result.data) {
      setAttachments(result.data);
    }
    setLoading(false);
  }, [appointmentId]);

  useEffect(() => {
    if (open) loadAttachments();
  }, [open, loadAttachments]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be selected again
    e.target.value = '';

    setUploading(true);
    try {
      // 1. Obter URL pré-assinada
      const urlResult = await getAttachmentUploadUrlAction(appointmentId, file.name);
      if (!urlResult.success || !urlResult.data) {
        toast.error(urlResult.error || 'Erro ao obter URL de upload');
        return;
      }

      // 2. Upload direto ao R2
      const uploadResp = await fetch(urlResult.data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      if (!uploadResp.ok) {
        toast.error('Falha ao enviar arquivo para o armazenamento');
        return;
      }

      // 3. Confirmar com o backend
      const confirmResult = await confirmAttachmentUploadAction(
        appointmentId,
        urlResult.data.objectKey,
        file.name,
        file.type || undefined,
        file.size
      );
      if (!confirmResult.success || !confirmResult.data) {
        toast.error(confirmResult.error || 'Erro ao confirmar upload');
        return;
      }

      setAttachments((prev) => [confirmResult.data!, ...prev]);
      toast.success(`"${file.name}" anexado com sucesso`);
    } catch {
      toast.error('Erro inesperado ao fazer upload');
    } finally {
      setUploading(false);
    }
  };

  const handleOpen = async (attachment: AttachmentResponse) => {
    setOpeningId(attachment.id);
    try {
      const result = await getAttachmentViewUrlAction(attachment.id);
      if (result.success && result.data) {
        window.open(result.data.url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error(result.error || 'Erro ao obter link do anexo');
      }
    } finally {
      setOpeningId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id);
    const result = await deleteAttachmentAction(id);
    setDeletingId(null);
    if (result.success) {
      setAttachments((prev) => prev.filter((a) => a.id !== id));
      toast.success(`"${name}" removido`);
    } else {
      toast.error(result.error || 'Erro ao remover anexo');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Anexos do Atendimento
          </DialogTitle>
        </DialogHeader>

        {/* Área de upload */}
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {uploading ? 'Enviando...' : 'Selecionar e enviar arquivo'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Imagens, PDF, Word, Excel, TXT. O arquivo será armazenado com segurança.
          </p>
        </div>

        <Separator />

        {/* Lista de anexos */}
        <div className="space-y-1 min-h-[80px]">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Carregando...</span>
            </div>
          ) : attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum anexo neste atendimento.
            </p>
          ) : (
            <div className="border rounded-lg divide-y max-h-72 overflow-y-auto">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{att.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(att.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                      {att.fileSizeBytes != null && (
                        <span className="ml-2">{formatFileSize(att.fileSizeBytes)}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleOpen(att)}
                      disabled={openingId === att.id}
                      title="Abrir"
                    >
                      {openingId === att.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ExternalLink className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(att.id, att.fileName)}
                      disabled={deletingId === att.id}
                      title="Remover"
                    >
                      {deletingId === att.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
