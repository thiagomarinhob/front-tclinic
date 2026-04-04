'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Check, ChevronsUpDown, Plus, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createLabOrderAction } from '@/actions/laboratory-actions';
import { getExamTypesAction, type ExamTypeItem } from '@/actions/exam-actions';
import { autocompletePatientsAction } from '@/actions/patient-actions';
import { getProfessionalsByClinicAction } from '@/actions/professional-actions';
import { getHealthPlansAction, type HealthPlan } from '@/actions/health-plan-actions';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/constants';
import type { LabSector, SampleType } from '@/types';

const CATEGORY_ORDER = [
  'Exames de Imagem',
  'Exames Laboratoriais',
  'Laudo Psiquiátrico',
  'Exames Admissionais',
];

const SECTOR_LABELS: Record<LabSector, string> = {
  HEMATOLOGY: 'Hematologia',
  BIOCHEMISTRY: 'Bioquímica',
  IMMUNOLOGY: 'Imunologia',
  MICROBIOLOGY: 'Microbiologia',
  URINALYSIS: 'Urinálise',
  PARASITOLOGY: 'Parasitologia',
  HORMONES: 'Hormônios',
  COAGULATION: 'Coagulação',
  OTHER: 'Outros',
};

const SAMPLE_LABELS: Record<SampleType, string> = {
  BLOOD: 'Sangue',
  URINE: 'Urina',
  FECES: 'Fezes',
  SWAB: 'Swab',
  SALIVA: 'Saliva',
  TISSUE: 'Tecido',
  OTHER: 'Outro',
};

const itemSchema = z.object({
  examTypeId: z.string().min(1, 'Selecione o tipo de exame'),
  examName: z.string().min(1, 'Nome obrigatório'),
  sector: z.string().optional(),
  sampleType: z.string().optional(),
  unit: z.string().optional(),
  referenceRangeText: z.string().optional(),
});

const schema = z
  .object({
    patientId: z.string().min(1, 'Selecione o paciente'),
    requesterType: z.enum(['REGISTERED', 'EXTERNAL']),
    requesterId: z.string().optional(),
    requesterName: z.string().optional(),
    priority: z.enum(['ROUTINE', 'URGENT']),
    paymentType: z.enum(['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BOLETO']),
    healthPlanId: z.string().optional(),
    clinicalNotes: z.string().optional(),
    items: z.array(itemSchema).min(1, 'Adicione pelo menos um exame'),
  })
  .superRefine((data, ctx) => {
    if (data.requesterType === 'REGISTERED' && !data.requesterId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione o profissional',
        path: ['requesterId'],
      });
    }
    if (data.requesterType === 'EXTERNAL' && !data.requesterName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe o nome do solicitante',
        path: ['requesterName'],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

interface PatientOption {
  id: string;
  name: string;
}

interface ProfessionalOption {
  id: string;
  fullName: string;
}

export function LabOrderForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [examTypes, setExamTypes] = useState<ExamTypeItem[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalOption[]>([]);
  const [healthPlans, setHealthPlans] = useState<HealthPlan[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [openItemIndex, setOpenItemIndex] = useState<number | null>(null);
  const [itemSearch, setItemSearch] = useState('');
  const [profOpen, setProfOpen] = useState(false);
  const [profSearch, setProfSearch] = useState('');

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      priority: 'ROUTINE',
      paymentType: 'PIX',
      requesterType: 'REGISTERED',
      items: [{ examTypeId: '', examName: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const requesterType = watch('requesterType');
  const requesterId = watch('requesterId');
  const watchedItems = watch('items');

  useEffect(() => {
    async function load() {
      const tenantId = user?.clinicId;
      const [typesRes, patientsRes, profsRes, plansRes] = await Promise.all([
        getExamTypesAction(),
        tenantId
          ? autocompletePatientsAction(tenantId)
          : Promise.resolve({ success: false as const, error: '' }),
        tenantId
          ? getProfessionalsByClinicAction(tenantId, 0, 200, 'user.fullName,asc', undefined, true)
          : Promise.resolve({ success: false as const, error: '' }),
        getHealthPlansAction(),
      ]);

      if (typesRes.success && typesRes.data) setExamTypes(typesRes.data);

      if (patientsRes.success && patientsRes.data) {
        const list = Array.isArray(patientsRes.data) ? patientsRes.data : [];
        setPatients(list.map((p: any) => ({ id: p.id, name: p.fullName || p.firstName })));
      }

      if (profsRes.success && profsRes.data) {
        const list = (profsRes.data as any).content ?? profsRes.data;
        setProfessionals(
          (Array.isArray(list) ? list : []).map((p: any) => ({
            id: p.id,
            fullName: p.user?.fullName ?? p.fullName ?? '',
          }))
        );
      }

      if (plansRes.success && plansRes.data) {
        setHealthPlans(plansRes.data.filter((p) => p.active));
      }

      setLoadingPatients(false);
    }

    if (user !== null) load();
  }, [user]);

  const selectedProfName = useMemo(
    () => professionals.find((p) => p.id === requesterId)?.fullName ?? '',
    [professionals, requesterId]
  );

  const filteredProfessionals = useMemo(() => {
    if (!profSearch.trim()) return professionals;
    const q = profSearch.toLowerCase();
    return professionals.filter((p) => p.fullName.toLowerCase().includes(q));
  }, [profSearch, professionals]);

  const catalog = useMemo(() => {
    const map = new Map<string, string[]>();

    for (const item of examTypes) {
      if (item.category === 'Laudo Psiquiátrico') continue;
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item.name);
    }

    return Array.from(map.entries())
      .map(([label, exams]) => ({ label, exams }))
      .sort((a, b) => {
        const ai = CATEGORY_ORDER.indexOf(a.label);
        const bi = CATEGORY_ORDER.indexOf(b.label);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });
  }, [examTypes]);

  const filteredCatalog = useMemo(() => {
    if (!itemSearch.trim()) return catalog;
    const q = itemSearch.toLowerCase();

    return catalog
      .map((cat) => ({
        ...cat,
        exams: cat.exams.filter((exam) => exam.toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.exams.length > 0 || cat.label.toLowerCase().includes(q));
  }, [itemSearch, catalog]);

  function handleExamTypeSelect(index: number, examName: string) {
    const type = examTypes.find((t) => t.name === examName);
    if (!type) return;

    setValue(`items.${index}.examTypeId`, type.id);
    setValue(`items.${index}.examName`, type.name);
    setOpenItemIndex(null);
    setItemSearch('');
  }

  async function onSubmit(values: FormValues) {
    const resolvedRequesterName =
      values.requesterType === 'REGISTERED'
        ? professionals.find((p) => p.id === values.requesterId)?.fullName
        : values.requesterName;

    const result = await createLabOrderAction({
      patientId: values.patientId,
      requesterName: resolvedRequesterName,
      priority: values.priority,
      paymentType: values.paymentType,
      healthPlanId: values.healthPlanId || undefined,
      clinicalNotes: values.clinicalNotes,
      items: values.items.map((item) => ({
        examName: item.examName,
        sector: (item.sector as LabSector) || undefined,
        sampleType: (item.sampleType as SampleType) || undefined,
        unit: item.unit,
        referenceRangeText: item.referenceRangeText,
      })),
    });

    if (result.success && result.data) {
      toast.success('Solicitação criada com sucesso!');
      router.push(ROUTES.LABORATORY_ORDER_DETAIL(result.data.id));
    } else {
      toast.error(result.error || 'Erro ao criar solicitação');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Dados da Solicitação</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="space-y-2 xl:col-span-4">
              <Label htmlFor="patientId">Paciente *</Label>
              {loadingPatients ? (
                <p className="h-10 flex items-center text-sm text-muted-foreground">
                  Carregando...
                </p>
              ) : (
                <Select onValueChange={(v) => setValue('patientId', v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.patientId && (
                <p className="text-sm text-destructive">{errors.patientId.message}</p>
              )}
            </div>

            <div className="space-y-2 xl:col-span-8">
              <Label>Solicitante *</Label>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                <div className="md:col-span-4">
                  <Select
                    defaultValue="REGISTERED"
                    onValueChange={(v) => {
                      setValue('requesterType', v as 'REGISTERED' | 'EXTERNAL');
                      if (v === 'REGISTERED') setValue('requesterName', '');
                      else setValue('requesterId', '');
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REGISTERED">Médico cadastrado</SelectItem>
                      <SelectItem value="EXTERNAL">Solicitação externa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-8">
                  {requesterType === 'REGISTERED' && (
                    <div className="space-y-1">
                      <Popover
                        open={profOpen}
                        onOpenChange={(open) => {
                          setProfOpen(open);
                          if (!open) setProfSearch('');
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={profOpen}
                            className={cn(
                              'h-10 w-full justify-between font-normal',
                              !selectedProfName && 'text-muted-foreground',
                              errors.requesterId && 'border-destructive'
                            )}
                          >
                            <span className="truncate">
                              {selectedProfName || 'Pesquisar profissional...'}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent
                          className="w-[var(--radix-popover-trigger-width)] p-0"
                          align="start"
                        >
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Buscar profissional..."
                              value={profSearch}
                              onValueChange={setProfSearch}
                            />
                            <CommandList>
                              {filteredProfessionals.length === 0 ? (
                                <CommandEmpty>Nenhum profissional encontrado.</CommandEmpty>
                              ) : (
                                <CommandGroup>
                                  {filteredProfessionals.map((prof) => (
                                    <CommandItem
                                      key={prof.id}
                                      value={prof.fullName}
                                      onSelect={() => {
                                        setValue('requesterId', prof.id);
                                        setProfOpen(false);
                                        setProfSearch('');
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4',
                                          requesterId === prof.id ? 'opacity-100' : 'opacity-0'
                                        )}
                                      />
                                      {prof.fullName}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {errors.requesterId && (
                        <p className="text-sm text-destructive">
                          {errors.requesterId.message}
                        </p>
                      )}
                    </div>
                  )}

                  {requesterType === 'EXTERNAL' && (
                    <div className="space-y-1">
                      <Input
                        {...register('requesterName')}
                        placeholder="Nome do solicitante externo"
                        className={cn('w-full', errors.requesterName && 'border-destructive')}
                      />
                      {errors.requesterName && (
                        <p className="text-sm text-destructive">
                          {errors.requesterName.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Prioridade *</Label>
              <Select
                defaultValue="ROUTINE"
                onValueChange={(v) => setValue('priority', v as 'ROUTINE' | 'URGENT')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROUTINE">Rotina</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pagamento *</Label>
              <Select
                defaultValue="PIX"
                onValueChange={(v) => setValue('paymentType', v as FormValues['paymentType'])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">Pix</SelectItem>
                  <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                  <SelectItem value="DEBIT_CARD">Cartão de Débito</SelectItem>
                  <SelectItem value="BOLETO">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Convênio</Label>
              <Select
                onValueChange={(v) => setValue('healthPlanId', v === '__none__' ? undefined : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sem convênio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem convênio</SelectItem>
                  {healthPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações Clínicas</Label>
            <Textarea
              {...register('clinicalNotes')}
              placeholder="Hipótese diagnóstica, informações relevantes..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-4">
          <CardTitle>Exames Solicitados</CardTitle>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ examTypeId: '', examName: '' })}
          >
            <Plus className="mr-1 h-4 w-4" />
            Adicionar Exame
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {errors.items && !Array.isArray(errors.items) && (
            <p className="text-sm text-destructive">{errors.items.message}</p>
          )}

          {fields.map((field, index) => {
            const selectedName = watchedItems?.[index]?.examName || '';
            const isOpen = openItemIndex === index;

            return (
              <div key={field.id} className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Exame {index + 1}
                  </span>

                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                  <div className="space-y-2 xl:col-span-6">
                    <Label className="text-xs">Tipo de Exame *</Label>

                    <Popover
                      open={isOpen}
                      onOpenChange={(open) => {
                        setOpenItemIndex(open ? index : null);
                        if (!open) setItemSearch('');
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={isOpen}
                          className={cn(
                            'h-10 w-full justify-between font-normal text-sm',
                            !selectedName && 'text-muted-foreground',
                            errors.items?.[index]?.examTypeId && 'border-destructive'
                          )}
                        >
                          <span className="truncate">
                            {selectedName || 'Selecione o tipo de exame...'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent
                        className="w-[var(--radix-popover-trigger-width)] p-0"
                        align="start"
                      >
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Buscar exame..."
                            value={itemSearch}
                            onValueChange={setItemSearch}
                          />
                          <CommandList>
                            {filteredCatalog.every((c) => c.exams.length === 0) ? (
                              <CommandEmpty>Nenhum exame encontrado.</CommandEmpty>
                            ) : (
                              filteredCatalog.map((category, catIndex) => {
                                if (category.exams.length === 0) return null;

                                return (
                                  <div key={category.label}>
                                    {catIndex > 0 &&
                                      filteredCatalog
                                        .slice(0, catIndex)
                                        .some((c) => c.exams.length > 0) && <CommandSeparator />}

                                    <CommandGroup heading={category.label}>
                                      {category.exams.map((exam) => (
                                        <CommandItem
                                          key={exam}
                                          value={exam}
                                          onSelect={() => handleExamTypeSelect(index, exam)}
                                        >
                                          <Check
                                            className={cn(
                                              'mr-2 h-4 w-4',
                                              selectedName === exam ? 'opacity-100' : 'opacity-0'
                                            )}
                                          />
                                          {exam}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </div>
                                );
                              })
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {errors.items?.[index]?.examTypeId && (
                      <p className="text-xs text-destructive">
                        {errors.items[index]?.examTypeId?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 xl:col-span-3">
                    <Label className="text-xs">Setor</Label>
                    <Select onValueChange={(v) => setValue(`items.${index}.sector`, v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o setor" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SECTOR_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 xl:col-span-3">
                    <Label className="text-xs">Tipo de Amostra</Label>
                    <Select onValueChange={(v) => setValue(`items.${index}.sampleType`, v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o material" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SAMPLE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 xl:col-span-6">
                    <Label className="text-xs">Unidade</Label>
                    <Input
                      {...register(`items.${index}.unit`)}
                      placeholder="Ex: mg/dL, g/dL"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2 xl:col-span-6">
                    <Label className="text-xs">Faixa de Referência</Label>
                    <Input
                      {...register(`items.${index}.referenceRangeText`)}
                      placeholder="Ex: 70-99 mg/dL"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Solicitação
        </Button>
      </div>
    </form>
  );
}