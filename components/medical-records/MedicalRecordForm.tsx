'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Mic, Save, Loader2, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { getMedicalRecordTemplatesAction } from '@/actions/medical-record-template-actions';
import {
  getMedicalRecordByAppointmentAction,
  saveMedicalRecordAction,
} from '@/actions/medical-record-actions';
import type {
  MedicalRecordTemplate,
  MedicalRecordTemplateField,
  VitalSigns,
  MedicalRecord,
} from '@/types';

interface MedicalRecordFormProps {
  appointmentId: string;
  tenantId: string | null;
  professionalType?: string | null;
  /** Quando preenchido, inclui modelos exclusivos desse profissional na listagem */
  professionalId?: string | null;
  vitalSigns?: VitalSigns | null;
  /** Chamado quando um prontuário existente é carregado (ex.: para preencher sinais vitais na página) */
  onRecordLoaded?: (record: MedicalRecord) => void;
  /** Chamado sempre que o conteúdo dos campos muda (inclusive sem salvar) */
  onContentChange?: (content: Record<string, unknown>) => void;
  /** Chamado quando o template selecionado muda */
  onTemplateChange?: (templateId: string) => void;
}

export function MedicalRecordForm({
  appointmentId,
  tenantId,
  professionalType,
  professionalId,
  vitalSigns,
  onRecordLoaded,
  onContentChange,
  onTemplateChange,
}: MedicalRecordFormProps) {
  const [templates, setTemplates] = useState<MedicalRecordTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
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
    if (selectedTemplateId) onTemplateChangeRef.current?.(selectedTemplateId);
  }, [selectedTemplateId]);

  // Uma única carga por appointmentId + tenantId (evita 11+ requisições)
  useEffect(() => {
    if (!tenantId || !appointmentId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setTemplatesError(null);

    async function init() {
      setLoading(true);
      try {
        const [templatesResult, recordResult] = await Promise.all([
          getMedicalRecordTemplatesAction(
            tenantId,
            true,
            professionalType ?? undefined,
            professionalId ?? undefined
          ),
          getMedicalRecordByAppointmentAction(appointmentId),
        ]);

        if (cancelled) return;

        if (templatesResult.success && templatesResult.data) {
          const list = Array.isArray(templatesResult.data) ? templatesResult.data : [];
          setTemplates(list);
          if (list.length > 0) {
            // Prioridade: template da especialidade > template padrão do tenant > primeiro da lista
            const specialtyMatch = list.find(
              (t) => t.professionalType && professionalType && t.professionalType === professionalType
            );
            const defaultId =
              specialtyMatch?.id ??
              list.find((t) => t.defaultTemplate)?.id ??
              list[0].id;
            setSelectedTemplateId((prev) => prev || defaultId);
          }
        } else {
          setTemplates([]);
          setTemplatesError(templatesResult.error ?? 'Erro ao carregar modelos');
        }

        if (recordResult.success && recordResult.data) {
          const record = recordResult.data;
          setRecordId(record.id);
          setSelectedTemplateId(record.templateId);
          setContent(
            record.content && typeof record.content === 'object'
              ? (record.content as Record<string, unknown>)
              : {}
          );
          onRecordLoadedRef.current?.(record);
        } else {
          setRecordId(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [appointmentId, tenantId, professionalType ?? '', professionalId ?? '']);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const templateFields: MedicalRecordTemplateField[] = (() => {
    const raw = selectedTemplate?.schema;
    if (!raw) return [];
    let list: MedicalRecordTemplateField[];
    if (typeof raw === 'string') {
      try { list = JSON.parse(raw); } catch { return []; }
    } else {
      list = Array.isArray(raw) ? raw : [];
    }
    return list.slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  })();

  const handleSave = async () => {
    if (!selectedTemplateId) {
      toast.error('Selecione um modelo de prontuário');
      return;
    }
    setSaving(true);
    try {
      const result = await saveMedicalRecordAction(
        appointmentId,
        selectedTemplateId,
        content,
        vitalSigns ?? undefined
      );
      if (result.success) {
        if (result.data?.id) setRecordId(result.data.id);
        toast.success('Prontuário salvo com sucesso!');
      } else {
        toast.error(result.error ?? 'Erro ao salvar');
      }
    } catch {
      toast.error('Erro ao salvar prontuário');
    } finally {
      setSaving(false);
    }
  };

  const handleDictate = () => {
    toast.info('Função de ditado em desenvolvimento');
  };

  const handleExportPdf = async () => {
    if (!recordId) return;
    setExportingPdf(true);
    try {
      const res = await fetch(`/api/medical-records/${recordId}/pdf`, { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || 'Erro ao gerar PDF');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prontuario-${recordId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF gerado com sucesso');
    } catch {
      toast.error('Erro ao gerar PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  const updateField = (fieldId: string, value: unknown) => {
    setContent((prev) => ({ ...prev, [fieldId]: value }));
  };

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

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-2">
          {templatesError && (
            <p className="text-sm text-destructive">{templatesError}</p>
          )}
          <p className="text-muted-foreground">
            Nenhum modelo de prontuário disponível. Cadastre um modelo na clínica ou use os padrões do sistema.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-2">
          <CardTitle>Prontuário</CardTitle>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Modelo</Label>
            <Select
              value={selectedTemplateId}
              onValueChange={(v) => {
                setSelectedTemplateId(v);
                setContent({});
              }}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Selecione o modelo" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                    {t.tenantId == null && (
                      <span className="ml-2 text-xs text-muted-foreground">(padrão)</span>
                    )}
                    {t.tenantId != null && t.professionalId != null && (
                      <span className="ml-2 text-xs text-muted-foreground">(do médico)</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {recordId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={exportingPdf}
            >
              {exportingPdf ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              Exportar PDF
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDictate}>
            <Mic className="mr-2 h-4 w-4" />
            Ditar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {templateFields.length > 0 ? (
          <Accordion type="multiple" className="space-y-4" defaultValue={templateFields.map((_: MedicalRecordTemplateField, i: number) => `item-${i}`)}>
            {templateFields.map((field: MedicalRecordTemplateField, index: number) => (
              <AccordionItem
                key={field.id}
                value={`item-${index}`}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  {field.label}
                  {(field as MedicalRecordTemplateField & { required?: boolean }).required && (
                    <span className="text-destructive ml-0.5">*</span>
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  {field.type === 'textarea' ? (
                    <Textarea
                      placeholder={field.placeholder}
                      rows={4}
                      value={(content[field.id] as string) ?? ''}
                      onChange={(e) => updateField(field.id, e.target.value)}
                      className="resize-none"
                    />
                  ) : field.type === 'checkbox' ? (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`${field.id}-cb`}
                        checked={!!content[field.id]}
                        onCheckedChange={(v) => updateField(field.id, !!v)}
                      />
                      <Label htmlFor={`${field.id}-cb`} className="cursor-pointer font-normal">
                        Sim / Não
                      </Label>
                    </div>
                  ) : field.type === 'radio' ? (
                    <div className="flex flex-col gap-2">
                      {((field as MedicalRecordTemplateField & { options?: string[] }).options ?? []).filter(Boolean).map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="radio"
                            id={`${field.id}-${i}`}
                            name={field.id}
                            checked={(content[field.id] as string) === opt}
                            onChange={() => updateField(field.id, opt)}
                            className="h-4 w-4 rounded-full border-primary text-primary focus:ring-primary"
                          />
                          <Label htmlFor={`${field.id}-${i}`} className="cursor-pointer font-normal">
                            {opt}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : field.type === 'mult_checkbox' ? (
                    <div className="flex flex-col gap-2">
                      {((field as MedicalRecordTemplateField & { options?: string[] }).options ?? []).filter(Boolean).map((opt, i) => {
                        const selected = (content[field.id] as string[] | undefined) ?? [];
                        const checked = selected.includes(opt);
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <Checkbox
                              id={`${field.id}-mc-${i}`}
                              checked={checked}
                              onCheckedChange={(v) => {
                                const next = v ? [...selected, opt] : selected.filter((x) => x !== opt);
                                updateField(field.id, next);
                              }}
                            />
                            <Label htmlFor={`${field.id}-mc-${i}`} className="cursor-pointer font-normal">
                              {opt}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  ) : field.type === 'select' ? (
                    <Select
                      value={(content[field.id] as string) ?? ''}
                      onValueChange={(v) => updateField(field.id, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {((field as MedicalRecordTemplateField & { options?: string[] }).options ?? []).filter(Boolean).map((opt, i) => (
                          <SelectItem key={i} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      placeholder={field.placeholder}
                      value={(content[field.id] as string) ?? ''}
                      onChange={(e) =>
                        updateField(
                          field.id,
                          field.type === 'number' ? Number(e.target.value) : e.target.value
                        )
                      }
                    />
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            Este modelo não possui campos definidos.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
