'use client'

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { createProcedureAction, updateProcedureAction } from '@/actions/procedure-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, FileText, Clock, DollarSign, Percent } from 'lucide-react';
import { useState } from 'react';
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
    .min(0, 'Preço base deve ser maior ou igual a zero')
    .multipleOf(0.01, 'Preço deve ter no máximo 2 casas decimais'),
  professionalCommissionPercent: z.coerce.number()
    .min(0, 'Comissão deve ser maior ou igual a zero')
    .max(100, 'Comissão deve ser no máximo 100%')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

type ProcedureFormData = z.infer<typeof procedureFormSchema>;

interface ProcedureFormProps {
  procedure?: Procedure;
  /** Chamado ao salvar com sucesso. No create, recebe o procedimento criado. */
  onSuccess?: (procedure?: Procedure) => void;
  professionalId?: string;
}

export function ProcedureForm({ procedure, onSuccess, professionalId }: ProcedureFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!procedure;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProcedureFormData>({
    resolver: zodResolver(procedureFormSchema) as any,
    defaultValues: {
      name: procedure?.name || '',
      description: procedure?.description || '',
      estimatedDurationMinutes: procedure?.estimatedDurationMinutes || 30,
      basePrice: procedure?.basePrice || 0,
      professionalCommissionPercent: procedure?.professionalCommissionPercent || undefined,
    },
  });

  const formatCurrencyInput = (value: number | string | undefined): string => {
    if (value === undefined || value === null || value === '') return '';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '';
    return numValue.toFixed(2).replace('.', ',');
  };

  const parseCurrency = (value: string): number => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return 0;
    // Converte para número e divide por 100 para ter centavos
    return Number(numbers) / 100;
  };

  const onSubmit = async (data: ProcedureFormData) => {
    if (!user?.clinicId) {
      toast.error('ID da clínica não encontrado');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && procedure) {
        const result = await updateProcedureAction(procedure.id, {
          name: data.name,
          description: data.description || undefined,
          estimatedDurationMinutes: data.estimatedDurationMinutes,
          basePrice: data.basePrice,
          professionalCommissionPercent: data.professionalCommissionPercent,
        });

        if (result.success && result.data) {
          toast.success('Procedimento atualizado com sucesso!');
          queryClient.invalidateQueries({ queryKey: ['procedures'] });
          queryClient.invalidateQueries({ queryKey: ['procedure', procedure.id] });

          if (onSuccess) {
            onSuccess(result.data);
          } else {
            router.push('/procedures');
          }
        } else {
          toast.error(result.error || 'Erro ao atualizar procedimento');
        }
      } else {
        const result = await createProcedureAction({
          tenantId: user.clinicId,
          name: data.name,
          description: data.description || undefined,
          estimatedDurationMinutes: data.estimatedDurationMinutes,
          basePrice: data.basePrice,
          professionalCommissionPercent: data.professionalCommissionPercent,
          professionalId: professionalId,
        });

        if (result.success && result.data) {
          toast.success('Procedimento cadastrado com sucesso!');
          queryClient.invalidateQueries({ queryKey: ['procedures'] });

          if (onSuccess) {
            onSuccess(result.data);
          } else {
            router.push('/procedures');
          }
        } else {
          toast.error(result.error || 'Erro ao cadastrar procedimento');
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar procedimento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informações Básicas
          </CardTitle>
          <CardDescription>
            Dados principais do procedimento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              rows={4}
              {...register('description')}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Duração e Preços */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Duração e Valores
          </CardTitle>
          <CardDescription>
            Configure a duração estimada e os valores do procedimento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedDurationMinutes">
                Duração Estimada (minutos) <span className="text-destructive">*</span>
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
              <p className="text-xs text-muted-foreground">
                Tempo estimado para realização do procedimento
              </p>
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
              <p className="text-xs text-muted-foreground">
                Valor cobrado ao paciente
              </p>
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
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Atualizar Procedimento' : 'Cadastrar Procedimento'}
        </Button>
      </div>
    </form>
  );
}
