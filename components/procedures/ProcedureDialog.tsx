'use client'

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { createProcedureAction, updateProcedureAction } from '@/actions/procedure-actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, FileText, Clock, DollarSign, Percent } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Procedure } from '@/types';

const procedureFormSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(200, 'Nome deve ter no máximo 200 caracteres'),
  description: z.string().optional(),
  estimatedDurationMinutes: z.coerce.number()
    .int('Duração deve ser um número inteiro')
    .min(1, 'Duração deve ser no mínimo 1 minuto'),
  basePrice: z.coerce.number()
    .min(0, 'Preço base deve ser maior ou igual a zero'),
  professionalCommissionPercent: z.coerce.number()
    .min(0, 'Comissão deve ser maior ou igual a zero')
    .max(100, 'Comissão deve ser no máximo 100%')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

type ProcedureFormData = z.infer<typeof procedureFormSchema>;

interface ProcedureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedure?: Procedure;
  onSuccess?: (procedure?: Procedure) => void;
  professionalId?: string;
}

export function ProcedureDialog({
  open,
  onOpenChange,
  procedure,
  onSuccess,
  professionalId
}: ProcedureDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!procedure;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProcedureFormData>({
    resolver: zodResolver(procedureFormSchema) as any,
  });

  // Reset form when dialog opens/closes or procedure changes
  useEffect(() => {
    if (open) {
      reset({
        name: procedure?.name || '',
        description: procedure?.description || '',
        estimatedDurationMinutes: procedure?.estimatedDurationMinutes || 30,
        basePrice: procedure?.basePrice || 0,
        professionalCommissionPercent: procedure?.professionalCommissionPercent || undefined,
      });
    }
  }, [open, procedure, reset]);

  const formatCurrencyInput = (value: number | string | undefined): string => {
    if (value === undefined || value === null || value === '') return '';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '';
    return numValue.toFixed(2).replace('.', ',');
  };

  const parseCurrency = (value: string): number => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return 0;
    return Number(numbers) / 100;
  };

  const onSubmit = async (data: ProcedureFormData) => {
    if (!user?.clinicId) {
      toast.error('ID da clínica não encontrado');
      return;
    }

    setIsSubmitting(true);

    try {
      let result;

      if (isEditing && procedure) {
        result = await updateProcedureAction(procedure.id, {
          name: data.name,
          description: data.description || undefined,
          estimatedDurationMinutes: data.estimatedDurationMinutes,
          basePrice: data.basePrice,
          professionalCommissionPercent: data.professionalCommissionPercent,
        });
      } else {
        result = await createProcedureAction({
          tenantId: user.clinicId,
          name: data.name,
          description: data.description || undefined,
          estimatedDurationMinutes: data.estimatedDurationMinutes,
          basePrice: data.basePrice,
          professionalCommissionPercent: data.professionalCommissionPercent,
          professionalId: professionalId,
        });
      }

      if (result.success && result.data) {
        queryClient.invalidateQueries({ queryKey: ['procedures'] });
        if (isEditing && procedure) {
          queryClient.invalidateQueries({ queryKey: ['procedure', procedure.id] });
        }
        toast.success(
          isEditing
            ? 'Procedimento atualizado com sucesso!'
            : 'Procedimento cadastrado com sucesso!'
        );
        onOpenChange(false);
        onSuccess?.(result.data);
      } else {
        toast.error(result.error || 'Erro ao salvar procedimento');
      }
    } catch (error) {
      toast.error('Erro inesperado ao salvar procedimento');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isEditing ? 'Editar Procedimento' : 'Novo Procedimento'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações do procedimento.'
              : 'Preencha os dados para cadastrar um novo procedimento.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <form id="procedure-dialog-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <FileText className="h-4 w-4" />
                Informações Básicas
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome do Procedimento <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: Consulta médica, Exame de sangue..."
                  {...register('name')}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o procedimento, indicações, preparo necessário..."
                  rows={3}
                  {...register('description')}
                />
              </div>
            </div>

            <Separator />

            {/* Duração e Valores */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Clock className="h-4 w-4" />
                Duração e Valores
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="estimatedDurationMinutes">
                    Duração Estimada (min) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="estimatedDurationMinutes"
                    type="number"
                    min="1"
                    placeholder="30"
                    {...register('estimatedDurationMinutes')}
                    className={errors.estimatedDurationMinutes ? 'border-destructive' : ''}
                  />
                  {errors.estimatedDurationMinutes && (
                    <p className="text-sm text-destructive">
                      {errors.estimatedDurationMinutes.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="basePrice">
                    Preço Base <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="basePrice"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="basePrice"
                          type="text"
                          placeholder="0,00"
                          className={`pl-10 ${errors.basePrice ? 'border-destructive' : ''}`}
                          value={formatCurrencyInput(field.value)}
                          onChange={(e) => {
                            const numericValue = parseCurrency(e.target.value);
                            field.onChange(numericValue);
                          }}
                          onBlur={field.onBlur}
                        />
                      </div>
                    )}
                  />
                  {errors.basePrice && (
                    <p className="text-sm text-destructive">{errors.basePrice.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="professionalCommissionPercent">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Comissão do Profissional (%)
                  </div>
                </Label>
                <Input
                  id="professionalCommissionPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0,00"
                  {...register('professionalCommissionPercent')}
                  className={errors.professionalCommissionPercent ? 'border-destructive' : ''}
                />
                {errors.professionalCommissionPercent && (
                  <p className="text-sm text-destructive">
                    {errors.professionalCommissionPercent.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Percentual de comissão para cálculo automático de repasse ao profissional
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="procedure-dialog-form"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Salvar' : 'Cadastrar Procedimento'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
