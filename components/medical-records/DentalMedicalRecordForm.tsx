'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { Loader2, Save, FileDown, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { getMedicalRecordTemplatesAction } from '@/actions/medical-record-template-actions';
import {
  getMedicalRecordByAppointmentAction,
  saveMedicalRecordAction,
} from '@/actions/medical-record-actions';
import type { VitalSigns, MedicalRecord } from '@/types';
import odontogramaImg from '@/app/images/odontograma.jpg';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DentalMedicalRecordFormProps {
  appointmentId: string;
  tenantId: string | null;
  professionalType?: string | null;
  professionalId?: string | null;
  vitalSigns?: VitalSigns | null;
  onRecordLoaded?: (record: MedicalRecord) => void;
  onContentChange?: (content: Record<string, unknown>) => void;
  onTemplateChange?: (templateId: string) => void;
}

type Q = { id: string; label: string; hasQual?: boolean; qualLabel?: string };

// ─── Step definitions ────────────────────────────────────────────────────────

const STEPS = [
  { id: 'anamnese', title: 'Anamnese', subtitle: 'Ficha clínica' },
  { id: 'questionario', title: 'Questionário de Saúde', subtitle: 'Histórico médico' },
  { id: 'inventario', title: 'Inventário Odontológico', subtitle: 'Saúde bucal' },
  { id: 'exame', title: 'Exame Físico', subtitle: 'Exame clínico + Odontograma' },
  { id: 'plano', title: 'Plano de Tratamento', subtitle: 'Diagnóstico e conduta' },
];

// ─── Health questionnaire sections ───────────────────────────────────────────

const HEALTH_SECTIONS: { id: string; title: string; questions?: Q[]; custom?: true }[] = [
  {
    id: 'digestorio',
    title: 'Sobre aparelho digestório',
    questions: [
      { id: 'dig_q1', label: 'Tem frequentemente ferida na boca, azia, gastrite ou úlcera gástrica?', hasQual: true },
      { id: 'dig_q2', label: 'Já teve diagnosticada a presença de Helicobacter Pylori?' },
      { id: 'dig_q3', label: 'Tem refluxo?' },
      { id: 'dig_q4', label: 'Tem afta ou lesões na boca com frequência?' },
      { id: 'dig_q5', label: 'Toma algum medicamento para problema gastrointestinal?', hasQual: true },
    ],
  },
  {
    id: 'hepatico',
    title: 'Sobre condição hepática',
    questions: [
      { id: 'hep_q1', label: 'Tem alguma disfunção hepática?', hasQual: true },
      { id: 'hep_q2', label: 'Toma algum medicamento para esta condição?', hasQual: true },
    ],
  },
  {
    id: 'cardiovascular',
    title: 'Sobre condição cardiovascular',
    questions: [
      { id: 'cardio_q1', label: 'Sua pressão arterial é alta ou baixa?' },
      { id: 'cardio_q2', label: 'Toma algum medicamento para controle de pressão arterial?', hasQual: true },
      { id: 'cardio_q3', label: 'Possui arritmia cardíaca?' },
      { id: 'cardio_q4', label: 'Toma algum medicamento para controle de arritmia cardíaca?', hasQual: true },
      { id: 'cardio_q5', label: 'Possui marca-passo, stent ou alguma prótese cardíaca?', hasQual: true },
      { id: 'cardio_q6', label: 'Toma medicamento anticoagulante?', hasQual: true },
      { id: 'cardio_q7', label: 'Tem prolapso de válvula cardíaca?' },
      { id: 'cardio_q8', label: 'Teve endocardite bacteriana?' },
    ],
  },
  {
    id: 'respiratorio',
    title: 'Sobre condição respiratória',
    questions: [
      { id: 'resp_q1', label: 'Sente falta de ar com frequência?', hasQual: true, qualLabel: 'Qual(is) circunstância(s)?' },
      { id: 'resp_q2', label: 'Tem asma ou bronquite já diagnosticada?', hasQual: true },
      { id: 'resp_q3', label: 'Tem ou teve tuberculose?', hasQual: true, qualLabel: 'Está sob medicação?' },
      { id: 'resp_q4', label: 'Toma algum medicamento para problema respiratório?', hasQual: true },
    ],
  },
  {
    id: 'genitourinario',
    title: 'Sobre aparelho genitourinário',
    questions: [
      { id: 'gunit_q1', label: 'Tem insuficiência renal?' },
      { id: 'gunit_q2', label: 'Faz tratamento de hemodiálise?', hasQual: true, qualLabel: 'Frequência:' },
      { id: 'gunit_q3', label: 'Toma algum medicamento para problema renal?', hasQual: true },
    ],
  },
  {
    id: 'motora',
    title: 'Sobre condição motora',
    questions: [
      { id: 'mot_q1', label: 'Usa órtese ou prótese óssea ou articular?', hasQual: true, qualLabel: 'Qual órtese? / Qual prótese e em que região do corpo?' },
      { id: 'mot_q2', label: 'Tem alguma doença reumática?', hasQual: true },
      { id: 'mot_q3', label: 'Apresenta osteopenia ou osteoporose?', hasQual: true },
      { id: 'mot_q4', label: 'Toma algum medicamento para tratamento de uma ou mais das condições acima?', hasQual: true },
    ],
  },
  {
    id: 'ist',
    title: 'Sobre doenças infectocontagiosas/IST',
    questions: [
      { id: 'ist_q1', label: 'Tem alguma doença infectocontagiosa?', hasQual: true },
      { id: 'ist_q2', label: 'Tem alguma infecção sexualmente transmissível?', hasQual: true },
      { id: 'ist_q3', label: 'Toma algum medicamento para alguma destas doenças?', hasQual: true },
    ],
  },
  {
    id: 'endocrino',
    title: 'Sobre condição endócrina e metabólica',
    questions: [
      { id: 'endo_q1', label: 'Tem diabetes?' },
      { id: 'endo_q2', label: 'Possui hipo ou hipertireoidismo?', hasQual: true },
      { id: 'endo_q3', label: 'Toma algum medicamento para alguma destas doenças?', hasQual: true },
    ],
  },
  { id: 'alergia', title: 'Sobre reação alérgica', custom: true },
  { id: 'lesoes', title: 'Sobre resposta do organismo à lesões de tecidos', custom: true },
  { id: 'cirurgia', title: 'Sobre procedimentos cirúrgicos em geral', custom: true },
  {
    id: 'gestacao',
    title: 'Sobre métodos contraceptivos e gestação',
    questions: [
      { id: 'gest_q1', label: 'Faz uso de medicamento anticoncepcional?', hasQual: true },
      { id: 'gest_q2', label: 'Está grávida?', hasQual: true, qualLabel: 'Tempo (em semanas):' },
      { id: 'gest_q3', label: 'Está em fase de lactação?' },
      { id: 'gest_q4', label: 'Houve intercorrência na atual gestação?' },
      { id: 'gest_q5', label: 'Houve intercorrência em gestação anterior?' },
      { id: 'gest_q6', label: 'Faz uso de algum medicamento em razão da gestação?', hasQual: true, qualLabel: 'Qual(is)? / Motivo?' },
    ],
  },
  { id: 'neoplasia', title: 'Sobre neoplasias', custom: true },
  { id: 'psicologico', title: 'Sobre problemas psicológicos/psiquiátricos', custom: true },
  {
    id: 'outros',
    title: 'Sobre doenças, síndromes ou medicamentos não especificados acima',
    questions: [
      { id: 'outr_q1', label: 'Tem ou teve alguma doença ou síndrome?', hasQual: true },
      { id: 'outr_q2', label: 'Está se submetendo a algum tratamento para saúde?', hasQual: true },
      { id: 'outr_q3', label: 'Está tomando algum medicamento para esta condição?', hasQual: true },
    ],
  },
  {
    id: 'deficiencia',
    title: 'Sobre condições de pessoa com deficiência',
    questions: [
      { id: 'def_q1', label: 'Apresenta alguma deficiência nos termos da Lei 13.146, de 06 de julho de 2015?', hasQual: true },
      { id: 'def_q2', label: 'Está em tratamento ou acompanhamento profissional?' },
    ],
  },
  { id: 'habitos', title: 'Sobre hábitos ou costumes', custom: true },
];

// ─── Helper sub-components ────────────────────────────────────────────────────

function YesNoRow({
  q,
  content,
  onChange,
}: {
  q: Q;
  content: Record<string, unknown>;
  onChange: (id: string, val: unknown) => void;
}) {
  const val = (content[q.id] as string) ?? '';
  const qualVal = (content[`${q.id}_qual`] as string) ?? '';
  return (
    <div className="space-y-1.5 py-2 border-b last:border-0 border-border/40">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm flex-1 leading-snug">{q.label}</span>
        <div className="flex gap-1 shrink-0">
          {(['Não', 'Sim'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(q.id, val === opt ? '' : opt)}
              className={cn(
                'px-2.5 py-0.5 text-xs rounded border transition-colors font-medium',
                val === opt
                  ? opt === 'Sim'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground border-muted-foreground/40'
                  : 'border-border text-muted-foreground hover:bg-muted/50'
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      {q.hasQual && val === 'Sim' && (
        <Input
          className="h-8 text-sm"
          placeholder={q.qualLabel ?? 'Qual(is)?'}
          value={qualVal}
          onChange={(e) => onChange(`${q.id}_qual`, e.target.value)}
        />
      )}
    </div>
  );
}

function TriRow({
  id,
  label,
  content,
  onChange,
}: {
  id: string;
  label: string;
  content: Record<string, unknown>;
  onChange: (id: string, val: unknown) => void;
}) {
  const val = (content[id] as string) ?? '';
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b last:border-0 border-border/40">
      <span className="text-sm flex-1 leading-snug">{label}</span>
      <div className="flex gap-1 shrink-0">
        {(['Sim', 'Não', 'Não sei'] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(id, val === opt ? '' : opt)}
            className={cn(
              'px-2 py-0.5 text-xs rounded border transition-colors font-medium',
              val === opt
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:bg-muted/50'
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Label className="text-xs font-medium text-muted-foreground">{children}</Label>;
}

function SmallTextarea({
  id,
  content,
  onChange,
  placeholder,
  rows = 3,
}: {
  id: string;
  content: Record<string, unknown>;
  onChange: (id: string, val: unknown) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <Textarea
      rows={rows}
      placeholder={placeholder}
      value={(content[id] as string) ?? ''}
      onChange={(e) => onChange(id, e.target.value)}
      className="resize-none text-sm"
    />
  );
}

function SmallInput({
  id,
  content,
  onChange,
  placeholder,
}: {
  id: string;
  content: Record<string, unknown>;
  onChange: (id: string, val: unknown) => void;
  placeholder?: string;
}) {
  return (
    <Input
      className="h-8 text-sm"
      placeholder={placeholder}
      value={(content[id] as string) ?? ''}
      onChange={(e) => onChange(id, e.target.value)}
    />
  );
}

// ─── Custom section renderers ─────────────────────────────────────────────────

function AlergiaSection({
  content,
  onChange,
}: {
  content: Record<string, unknown>;
  onChange: (id: string, val: unknown) => void;
}) {
  const alergias = (content['aler_tipos'] as string[]) ?? [];
  return (
    <div className="space-y-0">
      <YesNoRow q={{ id: 'aler_tem', label: 'Tem alguma alergia?' }} content={content} onChange={onChange} />
      {content['aler_tem'] === 'Sim' && (
        <div className="py-2 border-b border-border/40 space-y-2">
          <FieldLabel>A que?</FieldLabel>
          <div className="flex flex-wrap gap-4">
            {['Medicamento', 'Alimentos', 'Anestésico'].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <Checkbox
                  id={`aler_${item}`}
                  checked={alergias.includes(item)}
                  onCheckedChange={(v) => {
                    const next = v ? [...alergias, item] : alergias.filter((x) => x !== item);
                    onChange('aler_tipos', next);
                  }}
                />
                <Label htmlFor={`aler_${item}`} className="text-sm cursor-pointer font-normal">{item}</Label>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <Label className="text-sm">Outros:</Label>
              <Input
                className="h-7 w-36 text-sm"
                placeholder="Especificar..."
                value={(content['aler_outros'] as string) ?? ''}
                onChange={(e) => onChange('aler_outros', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
      <YesNoRow q={{ id: 'aler_teste', label: 'Já fez teste alérgico?' }} content={content} onChange={onChange} />
      <YesNoRow q={{ id: 'aler_anestesia', label: 'Já teve alguma reação alérgica com anestesia aplicada?' }} content={content} onChange={onChange} />
      {content['aler_anestesia'] === 'Sim' && (
        <div className="py-2 border-b border-border/40 space-y-1.5">
          <SmallInput id="aler_anestesia_desc" content={content} onChange={onChange} placeholder="Descreva o ocorrido:" />
          <SmallInput id="aler_anestesia_quando" content={content} onChange={onChange} placeholder="Em que tratamento e quando?" />
        </div>
      )}
    </div>
  );
}

function LesoesSection({
  content,
  onChange,
}: {
  content: Record<string, unknown>;
  onChange: (id: string, val: unknown) => void;
}) {
  return (
    <div className="space-y-0">
      <YesNoRow q={{ id: 'les_sangra', label: 'Costuma sangrar por longo tempo quando se corta?' }} content={content} onChange={onChange} />
      <div className="py-2 border-b border-border/40 space-y-1.5">
        <SmallInput id="les_tempo" content={content} onChange={onChange} placeholder="Tempo estimado (em minutos):" />
        <SmallInput id="les_cicatrizacao" content={content} onChange={onChange} placeholder="Como se dá sua cicatrização?" />
      </div>
    </div>
  );
}

function CirurgiaSection({
  content,
  onChange,
}: {
  content: Record<string, unknown>;
  onChange: (id: string, val: unknown) => void;
}) {
  return (
    <div className="space-y-0">
      <YesNoRow q={{ id: 'cir_tem', label: 'Já se submeteu a alguma cirurgia?' }} content={content} onChange={onChange} />
      {content['cir_tem'] === 'Sim' && (
        <div className="py-2 border-b border-border/40 space-y-1.5">
          <SmallInput id="cir_qual" content={content} onChange={onChange} placeholder="Qual(is)?" />
          <SmallInput id="cir_motivo" content={content} onChange={onChange} placeholder="Motivo?" />
          <SmallInput id="cir_intercorrencia" content={content} onChange={onChange} placeholder="Houve alguma intercorrência?" />
        </div>
      )}
    </div>
  );
}

function NeoplasiaSection({
  content,
  onChange,
}: {
  content: Record<string, unknown>;
  onChange: (id: string, val: unknown) => void;
}) {
  return (
    <div className="space-y-0">
      <YesNoRow q={{ id: 'neo_tem', label: 'Já teve algum diagnóstico de neoplasia?' }} content={content} onChange={onChange} />
      {content['neo_tem'] === 'Sim' && (
        <>
          <div className="py-2 border-b border-border/40 space-y-1.5">
            <FieldLabel>Tipo:</FieldLabel>
            <div className="flex gap-3">
              {['Benigna', 'Maligna'].map((tipo) => (
                <div key={tipo} className="flex items-center gap-1.5">
                  <Checkbox
                    id={`neo_${tipo}`}
                    checked={(content['neo_tipo'] as string) === tipo}
                    onCheckedChange={(v) => onChange('neo_tipo', v ? tipo : '')}
                  />
                  <Label htmlFor={`neo_${tipo}`} className="text-sm cursor-pointer font-normal">{tipo}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="py-2 border-b border-border/40 space-y-1.5">
            <SmallInput id="neo_qual" content={content} onChange={onChange} placeholder="Qual(is)?" />
            <SmallInput id="neo_tratamento" content={content} onChange={onChange} placeholder="Qual o tratamento a que se submeteu ou está em andamento?" />
            <SmallInput id="neo_situacao" content={content} onChange={onChange} placeholder="Qual a situação atual de controle?" />
          </div>
        </>
      )}
    </div>
  );
}

function PsicologicoSection({
  content,
  onChange,
}: {
  content: Record<string, unknown>;
  onChange: (id: string, val: unknown) => void;
}) {
  return (
    <div className="space-y-0">
      <YesNoRow q={{ id: 'psico_tem', label: 'Está ou esteve em tratamento psicológico/psiquiátrico?' }} content={content} onChange={onChange} />
      {content['psico_tem'] === 'Sim' && (
        <div className="py-2 border-b border-border/40 space-y-1.5">
          <SmallInput id="psico_diagnostico" content={content} onChange={onChange} placeholder="Motivo e/ou diagnóstico:" />
          <SmallInput id="psico_sintomas" content={content} onChange={onChange} placeholder="Descrever sintomas e tratamento:" />
          <SmallInput id="psico_medicamento" content={content} onChange={onChange} placeholder="Faz uso de algum medicamento em razão da condição?" />
        </div>
      )}
    </div>
  );
}

function HabitosSection({
  content,
  onChange,
}: {
  content: Record<string, unknown>;
  onChange: (id: string, val: unknown) => void;
}) {
  const habitos = (content['hab_lista'] as string[]) ?? [];
  const toggle = (item: string) => {
    const next = habitos.includes(item) ? habitos.filter((x) => x !== item) : [...habitos, item];
    onChange('hab_lista', next);
  };
  return (
    <div className="space-y-3 py-2">
      <FieldLabel>Tem algum hábito ou costume dentre os abaixo elencados?</FieldLabel>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox id="hab_fumo" checked={habitos.includes('Fumo')} onCheckedChange={() => toggle('Fumo')} />
          <Label htmlFor="hab_fumo" className="text-sm font-normal cursor-pointer">Fumo</Label>
          {habitos.includes('Fumo') && (
            <Input className="h-7 flex-1 text-sm" placeholder="Tipo e frequência:" value={(content['hab_fumo_freq'] as string) ?? ''} onChange={(e) => onChange('hab_fumo_freq', e.target.value)} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="hab_alcool" checked={habitos.includes('Álcool')} onCheckedChange={() => toggle('Álcool')} />
          <Label htmlFor="hab_alcool" className="text-sm font-normal cursor-pointer">Álcool</Label>
          {habitos.includes('Álcool') && (
            <Input className="h-7 flex-1 text-sm" placeholder="Frequência:" value={(content['hab_alcool_freq'] as string) ?? ''} onChange={(e) => onChange('hab_alcool_freq', e.target.value)} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="hab_droga" checked={habitos.includes('Droga ilícita')} onCheckedChange={() => toggle('Droga ilícita')} />
          <Label htmlFor="hab_droga" className="text-sm font-normal cursor-pointer">Droga ilícita</Label>
          {habitos.includes('Droga ilícita') && (
            <Input className="h-7 flex-1 text-sm" placeholder="Frequência:" value={(content['hab_droga_freq'] as string) ?? ''} onChange={(e) => onChange('hab_droga_freq', e.target.value)} />
          )}
        </div>
      </div>
      <div className="pt-1">
        <FieldLabel>Nome do(s) Médico(s) Assistente(s):</FieldLabel>
        <SmallTextarea id="hab_medicos" content={content} onChange={onChange} placeholder="Nome e telefone do(s) médico(s) assistente(s)..." rows={2} />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DentalMedicalRecordForm({
  appointmentId,
  tenantId,
  professionalType,
  professionalId,
  vitalSigns,
  onRecordLoaded,
  onContentChange,
  onTemplateChange,
}: DentalMedicalRecordFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [templateId, setTemplateId] = useState<string>('');
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const onRecordLoadedRef = useRef(onRecordLoaded);
  onRecordLoadedRef.current = onRecordLoaded;
  const onContentChangeRef = useRef(onContentChange);
  onContentChangeRef.current = onContentChange;
  const onTemplateChangeRef = useRef(onTemplateChange);
  onTemplateChangeRef.current = onTemplateChange;

  useEffect(() => {
    onContentChangeRef.current?.(content);
  }, [content]);

  useEffect(() => {
    if (templateId) onTemplateChangeRef.current?.(templateId);
  }, [templateId]);

  useEffect(() => {
    if (!tenantId || !appointmentId) { setLoading(false); return; }
    let cancelled = false;
    async function init() {
      setLoading(true);
      try {
        const [templatesResult, recordResult] = await Promise.all([
          getMedicalRecordTemplatesAction(tenantId!, true, professionalType ?? undefined, professionalId ?? undefined),
          getMedicalRecordByAppointmentAction(appointmentId),
        ]);
        if (cancelled) return;
        if (templatesResult.success && templatesResult.data) {
          const list = Array.isArray(templatesResult.data) ? templatesResult.data : [];
          const dental = list.find((t) => t.professionalType === 'DENTISTA') ?? list[0];
          if (dental) setTemplateId(dental.id);
        }
        if (recordResult.success && recordResult.data) {
          const record = recordResult.data;
          setRecordId(record.id);
          setTemplateId(record.templateId);
          setContent(record.content && typeof record.content === 'object' ? (record.content as Record<string, unknown>) : {});
          onRecordLoadedRef.current?.(record);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [appointmentId, tenantId, professionalType ?? '', professionalId ?? '']);

  const updateField = useCallback((id: string, val: unknown) => {
    setContent((prev) => ({ ...prev, [id]: val }));
  }, []);

  const handleSave = async () => {
    if (!templateId) { toast.error('Modelo de prontuário não encontrado'); return; }
    setSaving(true);
    try {
      const result = await saveMedicalRecordAction(appointmentId, templateId, content, vitalSigns ?? undefined);
      if (result.success) {
        if (result.data?.id) setRecordId(result.data.id);
        toast.success('Prontuário salvo com sucesso!');
      } else {
        toast.error(result.error ?? 'Erro ao salvar');
      }
    } catch { toast.error('Erro ao salvar prontuário'); }
    finally { setSaving(false); }
  };

  const handleExportPdf = async () => {
    if (!recordId) return;
    setExportingPdf(true);
    try {
      const res = await fetch(`/api/medical-records/${recordId}/pdf`, { credentials: 'include' });
      if (!res.ok) { toast.error('Erro ao gerar PDF'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `prontuario-${recordId}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF gerado com sucesso');
    } catch { toast.error('Erro ao gerar PDF'); }
    finally { setExportingPdf(false); }
  };

  // ─── Step renderers ───────────────────────────────────────────────────────

  const renderAnamnese = () => (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <FieldLabel>Queixa Principal — Qual o motivo de sua busca por tratamento?</FieldLabel>
        <SmallTextarea id="queixa_principal" content={content} onChange={updateField} placeholder="Descreva a queixa principal..." rows={3} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>História da Doença/Moléstia Atual — Descrição técnica</FieldLabel>
        <SmallTextarea id="historia_doenca" content={content} onChange={updateField} placeholder="Descreva a história da doença atual..." rows={3} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>História Pregressa Médica — Relato de atendimentos e tratamentos médicos anteriores</FieldLabel>
        <SmallTextarea id="historia_medica" content={content} onChange={updateField} placeholder="Histórico médico pregresso..." rows={3} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>História Pregressa Odontológica — Relato de atendimentos e tratamentos odontológicos anteriores</FieldLabel>
        <SmallTextarea id="historia_odonto" content={content} onChange={updateField} placeholder="Histórico odontológico pregresso..." rows={3} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>História Familiar — Informações sobre a saúde da pessoa e/ou de parentes/familiares</FieldLabel>
        <SmallTextarea id="historia_familiar" content={content} onChange={updateField} placeholder="Histórico familiar..." rows={3} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>História Pessoal e Social — Informações sobre o estilo de vida e hábitos do paciente</FieldLabel>
        <SmallTextarea id="historia_social" content={content} onChange={updateField} placeholder="Estilo de vida e hábitos sociais..." rows={3} />
      </div>
    </div>
  );

  const renderCustomSection = (sectionId: string) => {
    switch (sectionId) {
      case 'alergia': return <AlergiaSection content={content} onChange={updateField} />;
      case 'lesoes': return <LesoesSection content={content} onChange={updateField} />;
      case 'cirurgia': return <CirurgiaSection content={content} onChange={updateField} />;
      case 'neoplasia': return <NeoplasiaSection content={content} onChange={updateField} />;
      case 'psicologico': return <PsicologicoSection content={content} onChange={updateField} />;
      case 'habitos': return <HabitosSection content={content} onChange={updateField} />;
      default: return null;
    }
  };

  const renderQuestionario = () => (
    <Accordion type="multiple" className="space-y-1">
      {HEALTH_SECTIONS.map((section) => (
        <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-3">
          <AccordionTrigger className="hover:no-underline py-3 text-sm font-medium">
            {section.title}
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            {section.custom
              ? renderCustomSection(section.id)
              : section.questions?.map((q) => (
                  <YesNoRow key={q.id} q={q} content={content} onChange={updateField} />
                ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );

  const renderInventario = () => {
    const higienizacoes = (content['inv_higienizacoes'] as string[]) ?? [];
    const toggleHig = (item: string) => {
      const next = higienizacoes.includes(item) ? higienizacoes.filter((x) => x !== item) : [...higienizacoes, item];
      updateField('inv_higienizacoes', next);
    };
    const bebidas = (content['inv_bebidas'] as string[]) ?? [];
    const toggleBeb = (item: string) => {
      const next = bebidas.includes(item) ? bebidas.filter((x) => x !== item) : [...bebidas, item];
      updateField('inv_bebidas', next);
    };
    const habOral = (content['inv_hab_oral'] as string[]) ?? [];
    const toggleHabOral = (item: string) => {
      const next = habOral.includes(item) ? habOral.filter((x) => x !== item) : [...habOral, item];
      updateField('inv_hab_oral', next);
    };

    return (
      <div className="space-y-4">
        {/* Histórico dental */}
        <div className="space-y-2 p-3 rounded-lg border">
          <h4 className="text-sm font-semibold">Histórico de Tratamento</h4>
          <div className="space-y-2">
            <FieldLabel>Quando foi seu último tratamento odontológico?</FieldLabel>
            <SmallInput id="inv_ultimo_trat" content={content} onChange={updateField} placeholder="Data aproximada..." />
          </div>
          <YesNoRow q={{ id: 'inv_intercorrencia', label: 'Houve alguma intercorrência?', hasQual: true }} content={content} onChange={updateField} />
          <div className="space-y-1.5">
            <FieldLabel>Descrever a experiência:</FieldLabel>
            <SmallTextarea id="inv_experiencia" content={content} onChange={updateField} placeholder="Descreva a experiência..." rows={2} />
          </div>
        </div>

        {/* Higiene oral */}
        <div className="space-y-2 p-3 rounded-lg border">
          <h4 className="text-sm font-semibold">Higiene Oral</h4>
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm">Escova os dentes todos os dias?</span>
              <div className="flex gap-1 shrink-0">
                {['Não', 'Sim', 'Nem sempre'].map((opt) => {
                  const val = (content['inv_escova'] as string) ?? '';
                  return (
                    <button key={opt} type="button" onClick={() => updateField('inv_escova', val === opt ? '' : opt)}
                      className={cn('px-2 py-0.5 text-xs rounded border transition-colors font-medium',
                        val === opt ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted/50')}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <FieldLabel>Quantas vezes por dia:</FieldLabel>
                <SmallInput id="inv_escova_vezes" content={content} onChange={updateField} placeholder="Ex.: 3x" />
              </div>
              <div className="space-y-1">
                <FieldLabel>Frequência troca de escova:</FieldLabel>
                <SmallInput id="inv_troca_escova" content={content} onChange={updateField} placeholder="Ex.: 3 meses" />
              </div>
            </div>
            <div className="space-y-1">
              <FieldLabel>Tipo de escova de dente:</FieldLabel>
              <div className="flex gap-3">
                {['Cerdas duras', 'Cerdas médias', 'Cerdas macias'].map((opt) => {
                  const val = (content['inv_tipo_escova'] as string) ?? '';
                  return (
                    <div key={opt} className="flex items-center gap-1.5">
                      <Checkbox id={`escova_${opt}`} checked={val === opt} onCheckedChange={(v) => updateField('inv_tipo_escova', v ? opt : '')} />
                      <Label htmlFor={`escova_${opt}`} className="text-sm font-normal cursor-pointer">{opt}</Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <FieldLabel>Com que frequência usa fio ou fita dental?</FieldLabel>
            <div className="flex flex-wrap gap-3">
              {['Não uso', 'Diariamente', 'Após as refeições', 'Às vezes'].map((opt) => {
                const val = (content['inv_fio_dental'] as string) ?? '';
                return (
                  <div key={opt} className="flex items-center gap-1.5">
                    <Checkbox id={`fio_${opt}`} checked={val === opt} onCheckedChange={(v) => updateField('inv_fio_dental', v ? opt : '')} />
                    <Label htmlFor={`fio_${opt}`} className="text-sm font-normal cursor-pointer">{opt}</Label>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-1">
            <FieldLabel>Outras formas de higienização:</FieldLabel>
            <div className="flex flex-wrap gap-3">
              {['Passa-fio', 'Escova interdental', 'Unitufo', 'Bitufo', 'Escova elétrica', 'Hidrojateamento'].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <Checkbox id={`hig_${item}`} checked={higienizacoes.includes(item)} onCheckedChange={() => toggleHig(item)} />
                  <Label htmlFor={`hig_${item}`} className="text-sm font-normal cursor-pointer">{item}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm">Usa creme dental?</span>
              <div className="flex gap-1">
                {['Não', 'Sim'].map((opt) => {
                  const val = (content['inv_creme'] as string) ?? '';
                  return (
                    <button key={opt} type="button" onClick={() => updateField('inv_creme', val === opt ? '' : opt)}
                      className={cn('px-2 py-0.5 text-xs rounded border transition-colors font-medium',
                        val === opt ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted/50')}>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {(content['inv_creme'] as string) === 'Sim' && (
                <div className="flex gap-3">
                  {['Com flúor', 'Sem flúor'].map((opt) => {
                    const val = (content['inv_creme_tipo'] as string) ?? '';
                    return (
                      <div key={opt} className="flex items-center gap-1.5">
                        <Checkbox id={`creme_${opt}`} checked={val === opt} onCheckedChange={(v) => updateField('inv_creme_tipo', v ? opt : '')} />
                        <Label htmlFor={`creme_${opt}`} className="text-sm font-normal cursor-pointer">{opt}</Label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <YesNoRow q={{ id: 'inv_enxaguatorio', label: 'Faz uso de enxaguatório bucal (colutório)?', hasQual: true }} content={content} onChange={updateField} />
            <YesNoRow q={{ id: 'inv_fluor', label: 'Faz uso de flúor?', hasQual: true, qualLabel: 'Indicação / Frequência:' }} content={content} onChange={updateField} />
          </div>
        </div>

        {/* Sintomas */}
        <div className="space-y-2 p-3 rounded-lg border">
          <h4 className="text-sm font-semibold">Sintomas e Queixas Bucais</h4>
          <YesNoRow q={{ id: 'inv_dor_dente', label: 'Sente alguma dor em dente ou na gengiva?' }} content={content} onChange={updateField} />
          {(content['inv_dor_dente'] as string) === 'Sim' && (
            <div className="space-y-1.5 pl-2">
              <SmallInput id="inv_dor_regiao" content={content} onChange={updateField} placeholder="Descrever dente ou região:" />
              <div className="flex items-center gap-3">
                <FieldLabel>Natureza da dor:</FieldLabel>
                {['Espontânea', 'Provocada'].map((opt) => {
                  const val = (content['inv_dor_natureza'] as string) ?? '';
                  return (
                    <div key={opt} className="flex items-center gap-1.5">
                      <Checkbox id={`dor_${opt}`} checked={val === opt} onCheckedChange={(v) => updateField('inv_dor_natureza', v ? opt : '')} />
                      <Label htmlFor={`dor_${opt}`} className="text-sm font-normal cursor-pointer">{opt}</Label>
                    </div>
                  );
                })}
              </div>
              <SmallInput id="inv_dor_fator" content={content} onChange={updateField} placeholder="Fator desencadeador:" />
            </div>
          )}
          <div>
            <div className="flex items-start justify-between gap-3 py-2">
              <span className="text-sm">Apresenta sangramento na gengiva?</span>
              <div className="flex gap-1 shrink-0">
                {['Não', 'Ao escovar', 'Ao usar fio', 'Espontâneo'].map((opt) => {
                  const val = (content['inv_sangramento'] as string) ?? '';
                  return (
                    <button key={opt} type="button" onClick={() => updateField('inv_sangramento', val === opt ? '' : opt)}
                      className={cn('px-2 py-0.5 text-xs rounded border transition-colors font-medium',
                        val === opt ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted/50')}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
            {(content['inv_sangramento'] as string) && (content['inv_sangramento'] as string) !== 'Não' && (
              <SmallInput id="inv_sangramento_regiao" content={content} onChange={updateField} placeholder="Descrever dente ou região:" />
            )}
          </div>
          <YesNoRow q={{ id: 'inv_dentes_moles', label: 'Sente seus dentes moles?', hasQual: true, qualLabel: 'Descrever dente ou região:' }} content={content} onChange={updateField} />
          <YesNoRow q={{ id: 'inv_mau_halito', label: 'Sente ou lhe disseram sobre ter mau hálito?', hasQual: true, qualLabel: 'Fator desencadeador ou associado:' }} content={content} onChange={updateField} />
          <YesNoRow q={{ id: 'inv_xerostomia', label: 'Sente gosto ruim na boca ou xerostomia (boca seca)?', hasQual: true, qualLabel: 'Fator desencadeador ou associado:' }} content={content} onChange={updateField} />
        </div>

        {/* ATM e periodontal */}
        <div className="space-y-2 p-3 rounded-lg border">
          <h4 className="text-sm font-semibold">Periodontia e ATM</h4>
          <TriRow id="inv_periodontal" label="Já se submeteu a tratamento periodontal?" content={content} onChange={updateField} />
          {(content['inv_periodontal'] as string) === 'Sim' && (
            <div className="pl-2 space-y-1.5">
              <SmallInput id="inv_periodontal_qual" content={content} onChange={updateField} placeholder="Qual(is)?" />
              <SmallInput id="inv_periodontal_quando" content={content} onChange={updateField} placeholder="Quando?" />
            </div>
          )}
          <TriRow id="inv_abertura_dif" label="Tem dificuldade ou limitação ao abrir a boca?" content={content} onChange={updateField} />
          <TriRow id="inv_dor_abertura" label="Sente dor ao abrir ou ao movimentar lateralmente a boca?" content={content} onChange={updateField} />
          {(content['inv_dor_abertura'] as string) === 'Sim' && (
            <SmallInput id="inv_dor_abertura_regiao" content={content} onChange={updateField} placeholder="Descrever região:" />
          )}
          <TriRow id="inv_barulho_ouvido" label="Ouve barulho (estalido/crepitação) no ouvido ao abrir a boca?" content={content} onChange={updateField} />
          <YesNoRow q={{ id: 'inv_dor_atm', label: 'Sente dor na maxila, mandíbula, face, ouvido, cabeça, nuca ou pescoço?' }} content={content} onChange={updateField} />
          {(content['inv_dor_atm'] as string) === 'Sim' && (
            <div className="pl-2 space-y-1.5">
              <SmallInput id="inv_dor_atm_regiao" content={content} onChange={updateField} placeholder="Em que região?" />
              <SmallInput id="inv_dor_atm_freq" content={content} onChange={updateField} placeholder="Frequência:" />
              <SmallInput id="inv_dor_atm_fator" content={content} onChange={updateField} placeholder="Fator desencadeador ou associado:" />
            </div>
          )}
          <div className="py-2 border-b border-border/40">
            <FieldLabel>Apresenta sensibilidade ou dor:</FieldLabel>
            <div className="flex flex-wrap gap-3 mt-1">
              {['Alimento quente', 'Alimento frio', 'Alimento doce'].map((item) => {
                const sens = (content['inv_sensibilidades'] as string[]) ?? [];
                return (
                  <div key={item} className="flex items-center gap-1.5">
                    <Checkbox id={`sens_${item}`} checked={sens.includes(item)} onCheckedChange={(v) => {
                      const next = v ? [...sens, item] : sens.filter((x) => x !== item);
                      updateField('inv_sensibilidades', next);
                    }} />
                    <Label htmlFor={`sens_${item}`} className="text-sm font-normal cursor-pointer">{item}</Label>
                  </div>
                );
              })}
            </div>
            {((content['inv_sensibilidades'] as string[]) ?? []).length > 0 && (
              <SmallInput id="inv_sensibilidades_dente" content={content} onChange={updateField} placeholder="Dente ou região:" />
            )}
          </div>
          <TriRow id="inv_alteracao_lingua" label="Apresenta alguma alteração na língua ou no palato?" content={content} onChange={updateField} />
          {(content['inv_alteracao_lingua'] as string) === 'Sim' && (
            <SmallInput id="inv_alteracao_lingua_desc" content={content} onChange={updateField} placeholder="Descrever:" />
          )}
          <TriRow id="inv_ferida_labio" label="Já teve alguma ferida ou bolha na face ou nos lábios?" content={content} onChange={updateField} />
          {(content['inv_ferida_labio'] as string) === 'Sim' && (
            <div className="pl-2 space-y-1.5">
              <SmallInput id="inv_ferida_regiao" content={content} onChange={updateField} placeholder="Em que região?" />
              <SmallInput id="inv_ferida_freq" content={content} onChange={updateField} placeholder="Frequência:" />
              <SmallInput id="inv_ferida_fator" content={content} onChange={updateField} placeholder="Fator desencadeador ou associado:" />
            </div>
          )}
          <TriRow id="inv_cansaco_atm" label="Acorda com sensação de cansaço ou dor na face ou na ATM?" content={content} onChange={updateField} />
          <div className="flex items-start justify-between gap-3 py-2 border-b border-border/40">
            <span className="text-sm">Aperta ou range os dentes?</span>
            <div className="flex gap-1 shrink-0">
              {['Sim', 'Não', 'Não sei'].map((opt) => {
                const val = (content['inv_bruxismo'] as string) ?? '';
                return (
                  <button key={opt} type="button" onClick={() => updateField('inv_bruxismo', val === opt ? '' : opt)}
                    className={cn('px-2 py-0.5 text-xs rounded border transition-colors font-medium',
                      val === opt ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted/50')}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
          {(content['inv_bruxismo'] as string) === 'Sim' && (
            <div className="flex gap-3 pl-2">
              {['Durante o dia', 'Pela noite'].map((opt) => {
                const brux = (content['inv_bruxismo_periodo'] as string[]) ?? [];
                return (
                  <div key={opt} className="flex items-center gap-1.5">
                    <Checkbox id={`brux_${opt}`} checked={brux.includes(opt)} onCheckedChange={(v) => {
                      const next = v ? [...brux, opt] : brux.filter((x) => x !== opt);
                      updateField('inv_bruxismo_periodo', next);
                    }} />
                    <Label htmlFor={`brux_${opt}`} className="text-sm font-normal cursor-pointer">{opt}</Label>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Hábitos orais */}
        <div className="space-y-2 p-3 rounded-lg border">
          <h4 className="text-sm font-semibold">Hábitos Orais e Dieta</h4>
          <FieldLabel>Hábitos:</FieldLabel>
          <div className="space-y-1.5">
            {[
              { id: 'Respiração bucal', label: 'Respirar pela boca' },
              { id: 'Onicofagia', label: 'Onicofagia (roer unha)' },
              { id: 'Palito', label: 'Uso de palito' },
              { id: 'Goma de mascar', label: 'Goma de mascar' },
            ].map(({ id, label }) => (
              <div key={id} className="flex items-center gap-2">
                <Checkbox id={`haboral_${id}`} checked={habOral.includes(id)} onCheckedChange={() => toggleHabOral(id)} />
                <Label htmlFor={`haboral_${id}`} className="text-sm font-normal cursor-pointer">{label}</Label>
                {habOral.includes(id) && (
                  <Input className="h-7 flex-1 text-sm" placeholder="Frequência:" value={(content[`inv_haboral_${id}_freq`] as string) ?? ''} onChange={(e) => updateField(`inv_haboral_${id}_freq`, e.target.value)} />
                )}
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Checkbox id="haboral_morder" checked={habOral.includes('Morder')} onCheckedChange={() => toggleHabOral('Morder')} />
              <Label htmlFor="haboral_morder" className="text-sm font-normal cursor-pointer">Morder</Label>
              {habOral.includes('Morder') && (
                <div className="flex gap-2 flex-1">
                  {['Lápis', 'Caneta'].map((opt) => (
                    <div key={opt} className="flex items-center gap-1.5">
                      <Checkbox id={`morder_${opt}`} checked={((content['inv_morder_tipo'] as string[]) ?? []).includes(opt)} onCheckedChange={(v) => {
                        const arr = (content['inv_morder_tipo'] as string[]) ?? [];
                        updateField('inv_morder_tipo', v ? [...arr, opt] : arr.filter((x) => x !== opt));
                      }} />
                      <Label htmlFor={`morder_${opt}`} className="text-sm font-normal cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                  <Input className="h-7 flex-1 text-sm" placeholder="Outro:" value={(content['inv_morder_outro'] as string) ?? ''} onChange={(e) => updateField('inv_morder_outro', e.target.value)} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="haboral_sucao" checked={habOral.includes('Sucção')} onCheckedChange={() => toggleHabOral('Sucção')} />
              <Label htmlFor="haboral_sucao" className="text-sm font-normal cursor-pointer">Sucção</Label>
              {habOral.includes('Sucção') && (
                <Input className="h-7 flex-1 text-sm" placeholder="Dedos / Chupeta / Chá / Outro:" value={(content['inv_sucao_tipo'] as string) ?? ''} onChange={(e) => updateField('inv_sucao_tipo', e.target.value)} />
              )}
            </div>
          </div>
          <div className="space-y-2 pt-1">
            <FieldLabel>Dieta:</FieldLabel>
            <div className="flex items-center gap-3">
              <span className="text-sm">Doces:</span>
              {['Sim', 'Não', 'Às vezes'].map((opt) => {
                const val = (content['inv_doces'] as string) ?? '';
                return (
                  <button key={opt} type="button" onClick={() => updateField('inv_doces', val === opt ? '' : opt)}
                    className={cn('px-2 py-0.5 text-xs rounded border transition-colors font-medium',
                      val === opt ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted/50')}>
                    {opt}
                  </button>
                );
              })}
              {(content['inv_doces'] as string) && (content['inv_doces'] as string) !== 'Não' && (
                <Input className="h-7 flex-1 text-sm" placeholder="Frequência:" value={(content['inv_doces_freq'] as string) ?? ''} onChange={(e) => updateField('inv_doces_freq', e.target.value)} />
              )}
            </div>
            <div className="space-y-1">
              <FieldLabel>Bebidas frequentes:</FieldLabel>
              <div className="flex flex-wrap gap-3">
                {['Café', 'Chá', 'Suco com corantes', 'Achocolatado', 'Refrigerantes'].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <Checkbox id={`beb_${item}`} checked={bebidas.includes(item)} onCheckedChange={() => toggleBeb(item)} />
                    <Label htmlFor={`beb_${item}`} className="text-sm font-normal cursor-pointer">{item}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="inv_entre_refeicoes" checked={!!(content['inv_entre_refeicoes'] as boolean)} onCheckedChange={(v) => updateField('inv_entre_refeicoes', !!v)} />
              <Label htmlFor="inv_entre_refeicoes" className="text-sm font-normal cursor-pointer">Ingere alimentos e/ou bebidas entre as refeições</Label>
            </div>
          </div>
        </div>

        {/* Tratamentos dentais */}
        <div className="space-y-2 p-3 rounded-lg border">
          <h4 className="text-sm font-semibold">Tratamentos Dentais</h4>
          <YesNoRow q={{ id: 'inv_endodontia', label: 'Já se submeteu a tratamento endodôntico?', hasQual: true, qualLabel: 'Dente(s):' }} content={content} onChange={updateField} />
          <YesNoRow q={{ id: 'inv_protese', label: 'Faz uso de prótese dentária?', hasQual: true, qualLabel: 'Tipo e dentes envolvidos:' }} content={content} onChange={updateField} />
          <YesNoRow q={{ id: 'inv_cirurgia_bucal', label: 'Já se submeteu a alguma cirurgia bucal ou facial?' }} content={content} onChange={updateField} />
          {(content['inv_cirurgia_bucal'] as string) === 'Sim' && (
            <div className="pl-2 space-y-1.5">
              <SmallInput id="inv_cirurgia_bucal_qual" content={content} onChange={updateField} placeholder="Qual(is)?" />
              <SmallInput id="inv_cirurgia_bucal_motivo" content={content} onChange={updateField} placeholder="Motivo?" />
              <SmallInput id="inv_cirurgia_bucal_intercorrencia" content={content} onChange={updateField} placeholder="Houve alguma intercorrência?" />
            </div>
          )}
          <YesNoRow q={{ id: 'inv_info_extra', label: 'Há alguma informação que queira acrescentar?', hasQual: true, qualLabel: 'Descrição:' }} content={content} onChange={updateField} />
        </div>
      </div>
    );
  };

  const renderExame = () => (
    <div className="space-y-4">
      <div className="space-y-2 p-3 rounded-lg border">
        <h4 className="text-sm font-semibold">Exame Geral</h4>
        <SmallTextarea id="exame_geral" content={content} onChange={updateField} placeholder="Descrição geral do exame físico..." rows={3} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <FieldLabel>Frequência cardíaca (BPM):</FieldLabel>
            <SmallInput id="exame_fc" content={content} onChange={updateField} placeholder="Ex.: 72" />
          </div>
          <div className="space-y-1">
            <FieldLabel>Pressão arterial (mm/Hg):</FieldLabel>
            <SmallInput id="exame_pa" content={content} onChange={updateField} placeholder="Ex.: 120x80" />
          </div>
          <div className="space-y-1">
            <FieldLabel>Alteração ganglionar:</FieldLabel>
            <SmallInput id="exame_ganglionar" content={content} onChange={updateField} placeholder="Descrever..." />
          </div>
          <div className="space-y-1">
            <FieldLabel>Cadeia / Natureza:</FieldLabel>
            <SmallInput id="exame_cadeia" content={content} onChange={updateField} placeholder="Cadeia / Natureza:" />
          </div>
        </div>
      </div>
      <div className="space-y-2 p-3 rounded-lg border">
        <h4 className="text-sm font-semibold">Loco-Regional</h4>
        <div className="space-y-1.5">
          <FieldLabel>Extraoral:</FieldLabel>
          <SmallTextarea id="exame_extraoral" content={content} onChange={updateField} placeholder="Descrição do exame extraoral..." rows={3} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Intraoral:</FieldLabel>
          <SmallTextarea id="exame_intraoral" content={content} onChange={updateField} placeholder="Descrição do exame intraoral..." rows={3} />
        </div>
      </div>
      <div className="space-y-2 p-3 rounded-lg border">
        <h4 className="text-sm font-semibold">Exame Dental — Odontograma Descritivo</h4>
        <SmallTextarea id="exame_odontograma_desc" content={content} onChange={updateField} placeholder="Descreva as condições de cada dente (Ex.: 11 - hígido, 16 - resina oclusal, 26 - cárie M...)..." rows={4} />
      </div>
      <div className="space-y-2 p-3 rounded-lg border">
        <h4 className="text-sm font-semibold">Odontograma Anatômico</h4>
        <p className="text-xs text-muted-foreground">Referência visual — marque as condições no odontograma descritivo acima.</p>
        <div className="relative w-full overflow-hidden rounded-md border bg-white">
          <Image
            src={odontogramaImg}
            alt="Odontograma Anatômico"
            className="w-full h-auto object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );

  const renderPlano = () => (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <FieldLabel>Opção 1:</FieldLabel>
        <SmallTextarea id="plano_opcao1" content={content} onChange={updateField} placeholder="Descreva o plano de tratamento — opção 1..." rows={4} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Opção 2:</FieldLabel>
        <SmallTextarea id="plano_opcao2" content={content} onChange={updateField} placeholder="Descreva o plano de tratamento — opção 2..." rows={4} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Opção 3:</FieldLabel>
        <SmallTextarea id="plano_opcao3" content={content} onChange={updateField} placeholder="Descreva o plano de tratamento — opção 3..." rows={4} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Observações / Procedimento realizado nesta consulta:</FieldLabel>
        <SmallTextarea id="plano_obs" content={content} onChange={updateField} placeholder="Observações adicionais, materiais utilizados, intercorrências..." rows={3} />
      </div>
    </div>
  );

  const renderStep = (step: number) => {
    switch (step) {
      case 0: return renderAnamnese();
      case 1: return renderQuestionario();
      case 2: return renderInventario();
      case 3: return renderExame();
      case 4: return renderPlano();
      default: return null;
    }
  };

  // ─── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!tenantId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Clínica não identificada. Faça login novamente.
        </CardContent>
      </Card>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Prontuário Odontológico</CardTitle>
        <div className="flex items-center gap-2">
          {recordId && (
            <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={exportingPdf}>
              {exportingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
              Exportar PDF
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex gap-6">
          {/* ── Vertical Stepper ── */}
          <div className="w-52 shrink-0 space-y-1">
            {STEPS.map((step, i) => {
              const isCompleted = i < currentStep;
              const isCurrent = i === currentStep;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(i)}
                  className={cn(
                    'flex items-start gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-colors',
                    isCurrent ? 'bg-primary/10' : 'hover:bg-muted/60',
                  )}
                >
                  <div className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold mt-0.5 transition-colors',
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground'
                      : isCurrent
                        ? 'border-primary text-primary'
                        : 'border-border text-muted-foreground',
                  )}>
                    {isCompleted ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className={cn(
                      'text-sm font-medium leading-tight truncate',
                      isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground',
                    )}>
                      {step.title}
                    </div>
                    <div className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
                      {step.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Step content ── */}
          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <h3 className="text-base font-semibold">{STEPS[currentStep].title}</h3>
              <p className="text-xs text-muted-foreground">{STEPS[currentStep].subtitle}</p>
            </div>

            <div className="min-h-[300px]">
              {renderStep(currentStep)}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentStep + 1} / {STEPS.length}
              </span>
              {currentStep < STEPS.length - 1 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))}
                >
                  Próximo
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
