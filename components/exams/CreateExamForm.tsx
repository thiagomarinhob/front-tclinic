'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { FileText, Loader2, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Patient } from '@/types';

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png';

export function CreateExamForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [patientId, setPatientId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [clinicalIndication, setClinicalIndication] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      // Se há arquivo de solicitação, faz o upload antes de redirecionar
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
      router.push(`/exams/${examId}`);
    } catch {
      toast.error('Erro ao criar exame');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <Label>Paciente *</Label>
        <PatientAutocomplete onSelect={handlePatientSelect} />
      </div>

      <div className="space-y-2">
        <Label>Tipo de exame *</Label>
        <ExamTypeSelect value={name} onChange={setName} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="clinicalIndication">Indicação clínica</Label>
        </div>

        <Textarea
          id="clinicalIndication"
          value={clinicalIndication}
          onChange={(e) => setClinicalIndication(e.target.value)}
          placeholder="Justificativa ou indicação clínica para o exame"
          rows={3}
        />

        <div className="space-y-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
          >
            <Paperclip className="mr-2 h-4 w-4" />
            Anexar Solicitação
          </Button>
        </div>

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

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Criar exame
      </Button>
    </form>
  );
}
