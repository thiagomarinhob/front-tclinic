'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox as CheckboxUI } from '@/components/ui/checkbox';
import { ArrowLeft, GripVertical, Trash2, Type, Hash, AlignLeft, Calendar, CheckSquare, Loader2, CircleDot, ListChecks, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  createMedicalRecordTemplateAction,
  updateMedicalRecordTemplateAction,
  getMedicalRecordTemplateByIdAction,
} from '@/actions/medical-record-template-actions';
import type {
  MedicalRecordTemplate,
  MedicalRecordTemplateField,
  CreateMedicalRecordTemplateRequest,
  UpdateMedicalRecordTemplateRequest,
} from '@/types';

const FIELD_TYPES: { value: MedicalRecordTemplateField['type']; label: string; icon: React.ReactNode }[] = [
  { value: 'text', label: 'Texto', icon: <Type className="h-5 w-5" /> },
  { value: 'number', label: 'Número', icon: <Hash className="h-5 w-5" /> },
  { value: 'textarea', label: 'Texto longo', icon: <AlignLeft className="h-5 w-5" /> },
  { value: 'date', label: 'Data', icon: <Calendar className="h-5 w-5" /> },
  { value: 'checkbox', label: 'Checkbox', icon: <CheckSquare className="h-5 w-5" /> },
  { value: 'radio', label: 'Radio (uma opção)', icon: <CircleDot className="h-5 w-5" /> },
  { value: 'mult_checkbox', label: 'Múltiplos checkboxes', icon: <ListChecks className="h-5 w-5" /> },
  { value: 'select', label: 'Select (opções)', icon: <ChevronDown className="h-5 w-5" /> },
];

function parseSchema(template: MedicalRecordTemplate | null): MedicalRecordTemplateField[] {
  if (!template) return [];
  const raw = template.schema;
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return []; } })() : [];
  return [...list].sort((a: MedicalRecordTemplateField, b: MedicalRecordTemplateField) => (a.order ?? 999) - (b.order ?? 999));
}

function createNewField(type: MedicalRecordTemplateField['type']): MedicalRecordTemplateField {
  const id = `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const defaults: Record<string, string> = {
    checkbox: 'Sim ou não',
    number: 'Campo numérico',
    date: 'Data',
    textarea: 'Texto longo',
    radio: 'Escolha uma opção',
    mult_checkbox: 'Selecione as opções',
    select: 'Selecione',
  };
  const label = defaults[type] ?? 'Nome do campo';
  const options = ['radio', 'mult_checkbox', 'select'].includes(type) ? ['Opção 1', 'Opção 2'] : undefined;
  return { id, label, type, placeholder: type === 'text' || type === 'textarea' ? 'Digite aqui...' : undefined, order: 999, required: false, options };
}

// Sortable field card
function SortableFieldCard({
  field,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  field: MedicalRecordTemplateField;
  index: number;
  onUpdate: (patch: Partial<MedicalRecordTemplateField>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 rounded-lg border bg-card p-3 ${isDragging ? 'opacity-80 shadow-lg z-10' : ''}`}
    >
      <button
        type="button"
        className="mt-2 p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
        aria-label="Arrastar para reordenar"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="flex-1 grid gap-2 min-w-0">
        <Input
          placeholder="Título do campo"
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="font-medium"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Select value={field.type} onValueChange={(v) => onUpdate({ type: v as MedicalRecordTemplateField['type'] })}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(field.type === 'text' || field.type === 'textarea' || field.type === 'number') && (
            <Input
              placeholder={field.type === 'number' ? 'Valor padrão (ex: 0)' : 'Placeholder'}
              value={field.placeholder ?? ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              className="max-w-[180px]"
            />
          )}
          {(field.type === 'radio' || field.type === 'mult_checkbox' || field.type === 'select') && (
            <div className="w-full col-span-full space-y-1.5">
              <Label className="text-xs text-muted-foreground">Opções</Label>
              <div className="space-y-1.5">
                {(field.options ?? []).map((opt, idx) => (
                  <div key={idx} className="flex gap-1 items-center">
                    <Input
                      placeholder={`Opção ${idx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const next = [...(field.options ?? [])];
                        next[idx] = e.target.value;
                        onUpdate({ options: next });
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive"
                      onClick={() => {
                        const next = (field.options ?? []).filter((_, i) => i !== idx);
                        onUpdate({ options: next });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onUpdate({ options: [...(field.options ?? []), 'Nova opção'] })}
                >
                  + Adicionar opção
                </Button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <Label htmlFor={`req-${field.id}`} className="text-sm whitespace-nowrap">Obrigatório</Label>
            <Switch
              id={`req-${field.id}`}
              checked={field.required ?? false}
              onCheckedChange={(v) => onUpdate({ required: !!v })}
            />
          </div>
        </div>
      </div>
      <Button type="button" variant="ghost" size="icon" className="text-destructive shrink-0" onClick={onRemove} disabled={!canRemove}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Simple preview of one field
function PreviewField({ field }: { field: MedicalRecordTemplateField }) {
  const label = field.label || 'Campo sem título';
  if (field.type === 'textarea') {
    return (
      <div className="space-y-1">
        <Label className="text-sm">{label}{field.required ? ' *' : ''}</Label>
        <textarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm" readOnly placeholder={field.placeholder || '...'} />
      </div>
    );
  }
  if (field.type === 'number') {
    return (
      <div className="space-y-1">
        <Label className="text-sm">{label}{field.required ? ' *' : ''}</Label>
        <input type="number" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" readOnly placeholder={field.placeholder || '0'} />
      </div>
    );
  }
  if (field.type === 'date') {
    return (
      <div className="space-y-1">
        <Label className="text-sm">{label}{field.required ? ' *' : ''}</Label>
        <div className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          DD/MM/AAAA
        </div>
      </div>
    );
  }
  if (field.type === 'checkbox') {
    return (
      <div className="flex items-center gap-2">
        <CheckboxUI disabled id={`preview-${field.id}`} />
        <Label htmlFor={`preview-${field.id}`} className="text-sm cursor-default">{label}{field.required ? ' *' : ''}</Label>
      </div>
    );
  }
  const opts = (field.options ?? []).filter(Boolean);
  if (field.type === 'radio') {
    return (
      <div className="space-y-2">
        <Label className="text-sm">{label}{field.required ? ' *' : ''}</Label>
        <div className="flex flex-col gap-1.5">
          {opts.length ? opts.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-primary bg-background" />
              <span className="text-sm">{opt}</span>
            </div>
          )) : <span className="text-xs text-muted-foreground">Nenhuma opção</span>}
        </div>
      </div>
    );
  }
  if (field.type === 'mult_checkbox') {
    return (
      <div className="space-y-2">
        <Label className="text-sm">{label}{field.required ? ' *' : ''}</Label>
        <div className="flex flex-col gap-1.5">
          {opts.length ? opts.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckboxUI disabled id={`preview-mc-${field.id}-${i}`} />
              <Label htmlFor={`preview-mc-${field.id}-${i}`} className="text-sm cursor-default">{opt}</Label>
            </div>
          )) : <span className="text-xs text-muted-foreground">Nenhuma opção</span>}
        </div>
      </div>
    );
  }
  if (field.type === 'select') {
    return (
      <div className="space-y-1">
        <Label className="text-sm">{label}{field.required ? ' *' : ''}</Label>
        <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" disabled>
          <option value="">Selecione...</option>
          {opts.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}{field.required ? ' *' : ''}</Label>
      <input type="text" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" readOnly placeholder={field.placeholder || '...'} />
    </div>
  );
}

interface MedicalRecordTemplateEditorPageProps {
  templateId: string | null;
  tenantId: string;
  professionalId: string | null;
  isProfessional: boolean;
}

export function MedicalRecordTemplateEditorPage({
  templateId,
  tenantId,
  professionalId,
  isProfessional,
}: MedicalRecordTemplateEditorPageProps) {
  const router = useRouter();
  const isEdit = !!templateId;
  const [name, setName] = useState('');
  const [professionalType, setProfessionalType] = useState('');
  const [asMyModel, setAsMyModel] = useState(false);
  const [fields, setFields] = useState<MedicalRecordTemplateField[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const loadTemplate = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    const res = await getMedicalRecordTemplateByIdAction(templateId);
    if (res.success && res.data) {
      const t = res.data;
      setName(t.name);
      setProfessionalType(t.professionalType ?? '');
      setAsMyModel(!!t.professionalId);
      setFields(parseSchema(t).map((f, i) => ({ ...f, order: i + 1, required: (f as MedicalRecordTemplateField & { required?: boolean }).required ?? false })));
    } else {
      toast.error(res.error ?? 'Modelo não encontrado');
      router.push('/settings');
    }
    setLoading(false);
  }, [templateId, router]);

  useEffect(() => {
    if (isEdit) loadTemplate();
    else setFields([]);
  }, [isEdit, loadTemplate]);

  const addField = (type: MedicalRecordTemplateField['type']) => {
    const nextOrder = fields.length + 1;
    setFields((prev) => [...prev, { ...createNewField(type), order: nextOrder }]);
  };

  const updateField = (id: string, patch: Partial<MedicalRecordTemplateField>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const removeField = (id: string) => {
    if (fields.length <= 1) return;
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFields((prev) => {
      const ids = prev.map((f) => f.id);
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const reordered = arrayMove(prev, oldIndex, newIndex);
      return reordered.map((f, i) => ({ ...f, order: i + 1 }));
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const requiredCount = fields.filter((f) => f.required).length;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Informe o nome do modelo.');
      return;
    }
    const validFields = fields.filter((f) => f.label.trim());
    if (validFields.length === 0) {
      toast.error('Adicione ao menos um campo com título.');
      return;
    }
    const schema = validFields.map((f, i) => ({
      id: f.id,
      label: f.label.trim(),
      type: f.type,
      placeholder: f.placeholder || undefined,
      order: i + 1,
      required: f.required ?? false,
      options: (f.type === 'radio' || f.type === 'mult_checkbox' || f.type === 'select') ? (f.options ?? []).filter(Boolean) : undefined,
    }));

    setSaving(true);
    try {
      if (isEdit) {
        const res = await updateMedicalRecordTemplateAction(templateId!, { name: name.trim(), professionalType: professionalType.trim() || undefined, schema });
        if (res.success) {
          toast.success('Modelo atualizado.');
          router.push('/settings');
        } else toast.error(res.error ?? 'Erro ao atualizar.');
      } else {
        const res = await createMedicalRecordTemplateAction({
          tenantId,
          professionalId: asMyModel && professionalId ? professionalId : undefined,
          name: name.trim(),
          professionalType: professionalType.trim() || undefined,
          schema,
        });
        if (res.success) {
          toast.success('Modelo criado.');
          router.push('/settings');
        } else toast.error(res.error ?? 'Erro ao criar.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">{isEdit ? 'Editar modelo' : 'Novo modelo de prontuário'}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar: tipos de campo */}
        <aside className="lg:col-span-3 rounded-xl bg-muted/50 border p-4 h-fit">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Tipos de campo</h2>
          <p className="text-xs text-muted-foreground mb-3">Clique para adicionar ao modelo</p>
          <ul className="space-y-1">
            {FIELD_TYPES.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => addField(opt.value)}
                  className="w-full flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-left hover:bg-accent transition-colors"
                >
                  {opt.icon}
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Centro: campos do modelo (ordenáveis) */}
        <section className="lg:col-span-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model-name">Nome do modelo</Label>
            <Input id="model-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Avaliação Fisioterápica" className="mt-1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proftype">Tipo de profissional (opcional)</Label>
            <Input id="proftype" value={professionalType} onChange={(e) => setProfessionalType(e.target.value)} placeholder="Ex.: FISIOTERAPEUTA" className="mt-1" />
          </div>
          {isProfessional && !isEdit && (
            <div className="flex items-center gap-2">
              <CheckboxUI id="asMy" checked={asMyModel} onCheckedChange={(v) => setAsMyModel(!!v)} />
              <Label htmlFor="asMy" className="cursor-pointer">Criar como meu modelo (somente eu)</Label>
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold mb-2">Campos do modelo</h2>
            <p className="text-xs text-muted-foreground mb-2">Arraste para alterar a ordem</p>
            {fields.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Nenhum campo ainda. Selecione um tipo na barra à esquerda para adicionar.
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                  <ul className="space-y-2">
                    {fields.map((field, index) => (
                      <li key={field.id}>
                        <SortableFieldCard
                          field={field}
                          index={index}
                          onUpdate={(patch) => updateField(field.id, patch)}
                          onRemove={() => removeField(field.id)}
                          canRemove={fields.length > 1}
                        />
                      </li>
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {fields.length} campo(s) · {requiredCount} obrigatório(s)
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? 'Salvar' : 'Criar modelo'}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/settings">Cancelar</Link>
            </Button>
          </div>
        </section>

        {/* Preview */}
        <section className="lg:col-span-4 rounded-xl border bg-muted/30 p-4 h-fit">
          <h2 className="text-sm font-semibold mb-3">Preview</h2>
          <div className="space-y-4">
            {fields.length === 0 ? (
              <p className="text-sm text-muted-foreground">O formulário aparecerá aqui conforme você adicionar campos.</p>
            ) : (
              fields.map((f) => <PreviewField key={f.id} field={f} />)
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
