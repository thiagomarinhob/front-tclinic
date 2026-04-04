'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createMedicalRecordTemplateAction,
  updateMedicalRecordTemplateAction,
} from '@/actions/medical-record-template-actions';
import type {
  MedicalRecordTemplate,
  MedicalRecordTemplateField,
  CreateMedicalRecordTemplateRequest,
  UpdateMedicalRecordTemplateRequest,
} from '@/types';

const FIELD_TYPES = [
  { value: 'text', label: 'Texto curto' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
] as const;

function sortFieldsByOrder(fields: MedicalRecordTemplateField[]): MedicalRecordTemplateField[] {
  return [...fields].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

interface MedicalRecordTemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  tenantId: string;
  professionalId: string | null;
  template: MedicalRecordTemplate | null;
}

export function MedicalRecordTemplateFormDialog({
  open,
  onOpenChange,
  onSaved,
  tenantId,
  professionalId,
  template,
}: MedicalRecordTemplateFormDialogProps) {
  const isEdit = !!template;
  const [name, setName] = useState('');
  const [professionalType, setProfessionalType] = useState('');
  const [asMyModel, setAsMyModel] = useState(false);
  const [fields, setFields] = useState<MedicalRecordTemplateField[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (template) {
      setName(template.name);
      setProfessionalType(template.professionalType ?? '');
      setAsMyModel(!!template.professionalId);
      const raw = template.schema;
      const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return []; } })() : [];
      setFields(sortFieldsByOrder(list).map((f: MedicalRecordTemplateField, i: number) => ({
        id: f.id || `field-${i}`,
        label: f.label || '',
        type: (f.type as string) || 'text',
        placeholder: f.placeholder ?? '',
        order: f.order ?? i + 1,
      })));
    } else {
      setName('');
      setProfessionalType('');
      setAsMyModel(false);
      setFields([{ id: 'field-1', label: '', type: 'text', placeholder: '', order: 1 }]);
    }
  }, [open, template]);

  const addField = () => {
    const maxOrder = fields.length === 0 ? 0 : Math.max(...fields.map((f) => f.order ?? 0));
    setFields([
      ...fields,
      { id: `field-${Date.now()}`, label: '', type: 'text', placeholder: '', order: maxOrder + 1 },
    ]);
  };

  const removeField = (index: number) => {
    if (fields.length <= 1) return;
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, patch: Partial<MedicalRecordTemplateField>) => {
    setFields(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const sortedFields = sortFieldsByOrder(fields);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Informe o nome do modelo.');
      return;
    }
    const validFields = fields.filter((f) => f.label.trim());
    if (validFields.length === 0) {
      toast.error('Adicione ao menos um campo com título.');
      return;
    }
    const schemaWithOrder = validFields.map((f, i) => ({
      id: f.id,
      label: f.label.trim(),
      type: f.type,
      placeholder: f.placeholder || undefined,
      order: i + 1,
    }));

    setSaving(true);
    try {
      if (isEdit) {
        const res = await updateMedicalRecordTemplateAction(template!.id, {
          name: name.trim(),
          professionalType: professionalType.trim() || undefined,
          schema: schemaWithOrder,
        });
        if (res.success) {
          toast.success('Modelo atualizado.');
          onSaved();
          onOpenChange(false);
        } else {
          toast.error(res.error ?? 'Erro ao atualizar.');
        }
      } else {
        const res = await createMedicalRecordTemplateAction({
          tenantId,
          professionalId: asMyModel && professionalId ? professionalId : undefined,
          name: name.trim(),
          professionalType: professionalType.trim() || undefined,
          schema: schemaWithOrder,
        });
        if (res.success) {
          toast.success('Modelo criado.');
          onSaved();
          onOpenChange(false);
        } else {
          toast.error(res.error ?? 'Erro ao criar.');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar modelo' : 'Novo modelo de prontuário'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do modelo</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Avaliação Fisioterápica"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="professionalType">Tipo de profissional (opcional)</Label>
            <Input
              id="professionalType"
              value={professionalType}
              onChange={(e) => setProfessionalType(e.target.value)}
              placeholder="Ex.: FISIOTERAPEUTA"
            />
          </div>
          {professionalId && !isEdit && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="asMyModel"
                checked={asMyModel}
                onCheckedChange={(v) => setAsMyModel(!!v)}
              />
              <Label htmlFor="asMyModel" className="cursor-pointer">
                Criar como meu modelo (somente eu verei e usarei)
              </Label>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Campos (título, tipo, ordem)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addField}>
                <Plus className="h-4 w-4 mr-1" />
                Campo
              </Button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {sortedFields.map((field, idx) => {
                const index = fields.findIndex((f) => f.id === field.id);
                if (index < 0) return null;
                return (
                  <div key={field.id} className="flex flex-wrap items-end gap-2 p-2 border rounded-md">
                    <div className="space-y-2 flex-1 min-w-[80px]">
                      <Label className="text-xs">Ordem</Label>
                      <Input
                        type="number"
                        min={1}
                        value={field.order ?? index + 1}
                        onChange={(e) => updateField(index, { order: parseInt(e.target.value, 10) || 1 })}
                      />
                    </div>
                    <div className="space-y-2 flex-[2] min-w-[120px]">
                      <Label className="text-xs">Título</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        placeholder="Ex.: Queixa principal"
                      />
                    </div>
                    <div className="space-y-2 w-[140px]">
                      <Label className="text-xs">Tipo</Label>
                      <Select
                        value={field.type}
                        onValueChange={(v) => updateField(index, { type: v })}
                      >
                        <SelectTrigger>
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
                    </div>
                    <div className="space-y-2 flex-1 min-w-[100px]">
                      <Label className="text-xs">Placeholder</Label>
                      <Input
                        value={field.placeholder ?? ''}
                        onChange={(e) => updateField(index, { placeholder: e.target.value })}
                        placeholder="Opcional"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => removeField(index)}
                      disabled={fields.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Use o campo &quot;Ordem&quot; para definir a ordem de exibição (ex.: 1, 2, 3). Você pode colocar a última pergunta na posição 2 alterando o número.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
