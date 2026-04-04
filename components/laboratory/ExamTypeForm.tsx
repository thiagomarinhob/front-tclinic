'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { createLabExamTypeAction, updateLabExamTypeAction } from '@/actions/laboratory-actions';
import type { LabExamType, LabSector, SampleType } from '@/types';

const SECTOR_OPTIONS: { value: LabSector; label: string }[] = [
  { value: 'HEMATOLOGY', label: 'Hematologia' },
  { value: 'BIOCHEMISTRY', label: 'Bioquímica' },
  { value: 'IMMUNOLOGY', label: 'Imunologia' },
  { value: 'MICROBIOLOGY', label: 'Microbiologia' },
  { value: 'URINALYSIS', label: 'Urinálise' },
  { value: 'PARASITOLOGY', label: 'Parasitologia' },
  { value: 'HORMONES', label: 'Hormônios' },
  { value: 'COAGULATION', label: 'Coagulação' },
  { value: 'OTHER', label: 'Outros' },
];

const SAMPLE_OPTIONS: { value: SampleType; label: string }[] = [
  { value: 'BLOOD', label: 'Sangue' },
  { value: 'URINE', label: 'Urina' },
  { value: 'FECES', label: 'Fezes' },
  { value: 'SWAB', label: 'Swab' },
  { value: 'SALIVA', label: 'Saliva' },
  { value: 'TISSUE', label: 'Tecido' },
  { value: 'OTHER', label: 'Outro' },
];

const schema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, 'Nome obrigatório'),
  sector: z.string().optional(),
  sampleType: z.string().optional(),
  unit: z.string().optional(),
  referenceRangeText: z.string().optional(),
  preparationInfo: z.string().optional(),
  turnaroundHours: z.string().optional(),
  active: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

interface ExamTypeFormProps {
  examType?: LabExamType | null;
  onSaved: () => void;
}

export function ExamTypeForm({ examType, onSaved }: ExamTypeFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: examType?.code ?? '',
      name: examType?.name ?? '',
      sector: examType?.sector ?? 'OTHER',
      sampleType: examType?.sampleType ?? undefined,
      unit: examType?.unit ?? '',
      referenceRangeText: examType?.referenceRangeText ?? '',
      preparationInfo: examType?.preparationInfo ?? '',
      turnaroundHours: examType?.turnaroundHours ? String(examType.turnaroundHours) : '',
      active: examType?.active ?? true,
    },
  });

  const active = watch('active');

  async function onSubmit(values: FormValues) {
    const payload = {
      code: values.code || undefined,
      name: values.name,
      sector: (values.sector as LabSector) || undefined,
      sampleType: (values.sampleType as SampleType) || undefined,
      unit: values.unit || undefined,
      referenceRangeText: values.referenceRangeText || undefined,
      preparationInfo: values.preparationInfo || undefined,
      turnaroundHours: values.turnaroundHours ? parseInt(values.turnaroundHours) : undefined,
    };

    let result;
    if (examType) {
      result = await updateLabExamTypeAction(examType.id, { ...payload, active: values.active });
    } else {
      result = await createLabExamTypeAction(payload);
    }

    if (result.success) {
      toast.success(examType ? 'Tipo atualizado!' : 'Tipo criado!');
      onSaved();
    } else {
      toast.error(result.error || 'Erro ao salvar');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Código (opcional)</Label>
          <Input {...register('code')} placeholder="Ex: HEM, GLI, TSH" />
        </div>

        <div className="space-y-2">
          <Label>Nome *</Label>
          <Input {...register('name')} placeholder="Ex: Hemograma Completo" />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Setor</Label>
          <Select defaultValue={examType?.sector || 'OTHER'} onValueChange={(v) => setValue('sector', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SECTOR_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tipo de Amostra</Label>
          <Select defaultValue={examType?.sampleType || ''} onValueChange={(v) => setValue('sampleType', v)}>
            <SelectTrigger><SelectValue placeholder="Selecione o material" /></SelectTrigger>
            <SelectContent>
              {SAMPLE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Unidade</Label>
          <Input {...register('unit')} placeholder="Ex: mg/dL, g/dL, U/L" />
        </div>

        <div className="space-y-2">
          <Label>Prazo (horas)</Label>
          <Input {...register('turnaroundHours')} type="number" min="1" placeholder="Ex: 24" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Faixa de Referência</Label>
        <Input {...register('referenceRangeText')} placeholder="Ex: 70-99 mg/dL (jejum), 70-140 mg/dL (pós-prandial)" />
      </div>

      <div className="space-y-2">
        <Label>Preparo Necessário</Label>
        <Textarea
          {...register('preparationInfo')}
          placeholder="Ex: Jejum de 12 horas, evitar atividade física..."
          rows={2}
        />
      </div>

      {examType && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="active"
            checked={active}
            onCheckedChange={(v) => setValue('active', !!v)}
          />
          <Label htmlFor="active">Ativo</Label>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {examType ? 'Salvar Alterações' : 'Criar Tipo de Exame'}
        </Button>
      </div>
    </form>
  );
}
