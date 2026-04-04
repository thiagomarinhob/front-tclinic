'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { enterLabResultAction, validateLabResultAction } from '@/actions/laboratory-actions';
import { LabResultStatusBadge } from './LabOrderStatusBadge';
import type { LabOrderItem, LabResultStatus } from '@/types';

const resultSchema = z.object({
  resultValue: z.string().min(1, 'Resultado obrigatório'),
  abnormal: z.boolean().optional(),
  critical: z.boolean().optional(),
  observations: z.string().optional(),
});

const validateSchema = z.object({
  validatedBy: z.string().min(1, 'Informe o responsável pela validação'),
  validationType: z.enum(['TECHNICAL', 'FINAL']),
});

type ResultFormValues = z.infer<typeof resultSchema>;
type ValidateFormValues = z.infer<typeof validateSchema>;

interface LabResultEntryProps {
  item: LabOrderItem;
  onUpdated: (item: LabOrderItem) => void;
}

export function LabResultEntry({ item, onUpdated }: LabResultEntryProps) {
  const [resultOpen, setResultOpen] = useState(false);
  const [validateOpen, setValidateOpen] = useState(false);
  const [validateType, setValidateType] = useState<'TECHNICAL' | 'FINAL'>('TECHNICAL');

  const resultForm = useForm<ResultFormValues>({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      resultValue: item.resultValue ?? '',
      abnormal: item.abnormal ?? false,
      critical: item.critical ?? false,
      observations: item.observations ?? '',
    },
  });

  const validateForm = useForm<ValidateFormValues>({
    resolver: zodResolver(validateSchema),
    defaultValues: { validatedBy: '', validationType: 'TECHNICAL' },
  });

  async function onSubmitResult(values: ResultFormValues) {
    const result = await enterLabResultAction(item.id, {
      resultValue: values.resultValue,
      abnormal: values.abnormal,
      critical: values.critical,
      observations: values.observations,
    });
    if (result.success && result.data) {
      toast.success('Resultado lançado!');
      onUpdated(result.data);
      setResultOpen(false);
    } else {
      toast.error(result.error || 'Erro ao lançar resultado');
    }
  }

  async function onSubmitValidation(values: ValidateFormValues) {
    const result = await validateLabResultAction(item.id, {
      validationType: validateType,
      validatedBy: values.validatedBy,
    });
    if (result.success && result.data) {
      toast.success(validateType === 'TECHNICAL' ? 'Validação técnica registrada!' : 'Resultado liberado!');
      onUpdated(result.data);
      setValidateOpen(false);
    } else {
      toast.error(result.error || 'Erro ao validar resultado');
    }
  }

  const canEnterResult = item.resultStatus === 'PENDING' || item.resultStatus === 'ENTERED';
  const canTechnicalValidate = item.resultStatus === 'ENTERED';
  const canFinalValidate = item.resultStatus === 'TECHNICAL_VALIDATED';

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{item.examName}</p>
          <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
            {item.unit && <span>Unidade: {item.unit}</span>}
            {item.referenceRangeText && <span>Referência: {item.referenceRangeText}</span>}
          </div>
        </div>
        <LabResultStatusBadge status={item.resultStatus as LabResultStatus} />
      </div>

      {item.resultValue && (
        <div className="bg-muted rounded p-3 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Resultado:</span>
            <span className={`font-mono ${item.abnormal ? 'text-red-600 font-bold' : ''}`}>
              {item.resultValue} {item.unit}
            </span>
            {item.abnormal && (
              <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Alterado</span>
            )}
            {item.critical && (
              <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded">Crítico</span>
            )}
          </div>
          {item.observations && (
            <p className="text-sm text-muted-foreground">Obs: {item.observations}</p>
          )}
          {item.technicalValidatedBy && (
            <p className="text-xs text-muted-foreground">
              Valid. técnica: {item.technicalValidatedBy}
            </p>
          )}
          {item.finalValidatedBy && (
            <p className="text-xs text-muted-foreground">
              Valid. final: {item.finalValidatedBy}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {canEnterResult && (
          <Button size="sm" variant="outline" onClick={() => setResultOpen(true)}>
            {item.resultStatus === 'PENDING' ? 'Lançar Resultado' : 'Editar Resultado'}
          </Button>
        )}
        {canTechnicalValidate && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setValidateType('TECHNICAL'); setValidateOpen(true); }}
          >
            Validação Técnica
          </Button>
        )}
        {canFinalValidate && (
          <Button
            size="sm"
            onClick={() => { setValidateType('FINAL'); setValidateOpen(true); }}
          >
            Liberar Resultado
          </Button>
        )}
      </div>

      {/* Result Entry Dialog */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lançar Resultado — {item.examName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={resultForm.handleSubmit(onSubmitResult)} className="space-y-4">
            {item.referenceRangeText && (
              <p className="text-sm text-muted-foreground">
                Faixa de referência: <span className="font-medium">{item.referenceRangeText}</span>
              </p>
            )}
            <div className="space-y-2">
              <Label>Resultado *</Label>
              <Input
                {...resultForm.register('resultValue')}
                placeholder={`Valor${item.unit ? ` (${item.unit})` : ''}`}
              />
              {resultForm.formState.errors.resultValue && (
                <p className="text-sm text-destructive">{resultForm.formState.errors.resultValue.message}</p>
              )}
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="abnormal"
                  checked={resultForm.watch('abnormal')}
                  onCheckedChange={(v) => resultForm.setValue('abnormal', !!v)}
                />
                <Label htmlFor="abnormal">Resultado alterado</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="critical"
                  checked={resultForm.watch('critical')}
                  onCheckedChange={(v) => resultForm.setValue('critical', !!v)}
                />
                <Label htmlFor="critical">Valor crítico</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea {...resultForm.register('observations')} placeholder="Observações técnicas..." rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResultOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={resultForm.formState.isSubmitting}>
                {resultForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Validation Dialog */}
      <Dialog open={validateOpen} onOpenChange={setValidateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {validateType === 'TECHNICAL' ? 'Validação Técnica' : 'Liberar Resultado'} — {item.examName}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={validateForm.handleSubmit(onSubmitValidation)} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {validateType === 'TECHNICAL'
                ? 'Confirme a validação técnica do resultado antes da liberação final.'
                : 'Ao liberar, o resultado ficará disponível. Esta ação não pode ser desfeita.'}
            </p>
            <div className="space-y-2">
              <Label>Responsável pela validação *</Label>
              <Input
                {...validateForm.register('validatedBy')}
                placeholder="Nome do biomédico / responsável"
              />
              {validateForm.formState.errors.validatedBy && (
                <p className="text-sm text-destructive">{validateForm.formState.errors.validatedBy.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setValidateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={validateForm.formState.isSubmitting}>
                {validateForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {validateType === 'TECHNICAL' ? 'Confirmar Validação' : 'Liberar Resultado'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
