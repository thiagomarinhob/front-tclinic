'use client';

import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  createExamAction,
  getPresignedRequestUploadUrlAction,
  confirmExamRequestUploadAction,
} from '@/actions/exam-actions';
import { PatientAutocomplete } from '@/components/appointments/PatientAutocomplete';
import { ExamTypeSelect } from '@/components/exams/ExamTypeSelect';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, FlaskConical, Loader2, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Patient } from '@/types';

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png';

interface ExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ExamDialog({ open, onOpenChange, onSuccess }: ExamDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [patientId, setPatientId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [clinicalIndication, setClinicalIndication] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setPatientId(null);
    setName('');
    setClinicalIndication('');
    setSelectedFile(null);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) resetForm();
    onOpenChange(value);
  };

  const handlePatientSelect = (patient: Patient) => {
    setPatientId(patient.id);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !name.trim()) {
      toast.error('Preencha o paciente e o tipo de exame.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createExamAction({
        patientId,
        name: name.trim(),
        clinicalIndication: clinicalIndication.trim() || undefined,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || 'Erro ao criar exame');
        return;
      }

      const examId = result.data.id;

      if (selectedFile) {
        try {
          const urlResult = await getPresignedRequestUploadUrlAction(examId, selectedFile.name);
          if (!urlResult.success || !urlResult.data) {
            toast.warning('Exame criado, mas não foi possível obter URL para a solicitação.');
          } else {
            const putResponse = await fetch(urlResult.data.uploadUrl, {
              method: 'PUT',
              body: selectedFile,
              headers: { 'Content-Type': selectedFile.type || 'application/octet-stream' },
            });

            if (!putResponse.ok) {
              toast.warning('Exame criado, mas o upload da solicitação falhou. Tente anexá-la novamente na página do exame.');
            } else {
              await confirmExamRequestUploadAction(examId, urlResult.data.objectKey);
            }
          }
        } catch {
          toast.warning('Exame criado, mas ocorreu um erro ao enviar a solicitação.');
        }
      }

      toast.success('Exame criado com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      handleOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error('Erro ao criar exame');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Novo Exame
          </DialogTitle>
          <DialogDescription>
            Registre um pedido de exame para o paciente.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <form id="exam-dialog-form" onSubmit={handleSubmit} className="space-y-6 pb-6">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <PatientAutocomplete onSelect={handlePatientSelect} />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Tipo de exame *</Label>
              <ExamTypeSelect value={name} onChange={setName} />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clinicalIndication">Indicação clínica</Label>
                <Textarea
                  id="clinicalIndication"
                  value={clinicalIndication}
                  onChange={(e) => setClinicalIndication(e.target.value)}
                  placeholder="Justificativa ou indicação clínica para o exame"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Solicitação (arquivo)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  <Paperclip className="mr-2 h-4 w-4" />
                  Anexar Solicitação
                </Button>

                {selectedFile && (
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate text-muted-foreground">{selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label="Remover arquivo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </form>
        </ScrollArea>

        <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" form="exam-dialog-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Exame
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
