'use client'

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClipboardList } from 'lucide-react';
import type { VitalSigns } from '@/types';

interface TriageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: VitalSigns | null) => void;
  initialData?: VitalSigns;
  readOnly?: boolean;
}

const emptyFormData: VitalSigns = {
  bloodPressure: '',
  heartRate: 0,
  temperature: 0,
  oxygenSaturation: 0,
  weight: 0,
  height: 0,
};

// Normaliza a altura para centímetros.
// Aceita valores em cm (ex: "173") ou em metros com vírgula ou ponto (ex: "1,73" / "1.73").
function parseHeight(value: string): number {
  const normalized = value.replace(',', '.');
  const num = parseFloat(normalized);
  if (isNaN(num) || num <= 0) return 0;
  // Se menor que 3, assume que está em metros e converte para cm
  if (num < 3) return Math.round(num * 100);
  return num;
}

export function TriageDialog({ open, onOpenChange, onConfirm, initialData, readOnly = false }: TriageDialogProps) {
  const [formData, setFormData] = useState<VitalSigns>(emptyFormData);
  // Valor bruto do campo altura (string) para aceitar vírgula durante a digitação
  const [heightRaw, setHeightRaw] = useState('');

  useEffect(() => {
    if (open) {
      const data = initialData && Object.keys(initialData).length > 0
        ? { ...emptyFormData, ...initialData }
        : emptyFormData;
      setFormData(data);
      setHeightRaw(data.height ? String(data.height) : '');
    }
  }, [open, initialData]);

  const handleOpenChange = (value: boolean) => {
    onOpenChange(value);
  };

  const handleSave = () => {
    onConfirm(formData);
    handleOpenChange(false);
  };

  const handleHeightChange = (value: string) => {
    setHeightRaw(value);
    setFormData((prev) => ({ ...prev, height: parseHeight(value) }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            {readOnly ? 'Visualizar Triagem' : 'Dados de Triagem'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Sinais vitais registrados na triagem deste agendamento.'
              : 'Preencha os sinais vitais do paciente.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pressão Arterial (mmHg)</Label>
              <Input
                placeholder="120/80"
                value={formData.bloodPressure}
                disabled={readOnly}
                onChange={(e) =>
                  setFormData({ ...formData, bloodPressure: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Freq. Cardíaca (bpm)</Label>
              <Input
                type="number"
                placeholder="72"
                value={formData.heartRate || ''}
                disabled={readOnly}
                onChange={(e) =>
                  setFormData({ ...formData, heartRate: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Temperatura (°C)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="36.5"
                value={formData.temperature || ''}
                disabled={readOnly}
                onChange={(e) =>
                  setFormData({ ...formData, temperature: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Saturação O₂ (%)</Label>
              <Input
                type="number"
                placeholder="98"
                value={formData.oxygenSaturation || ''}
                disabled={readOnly}
                onChange={(e) =>
                  setFormData({ ...formData, oxygenSaturation: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Peso (kg)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="68"
                value={formData.weight || ''}
                disabled={readOnly}
                onChange={(e) =>
                  setFormData({ ...formData, weight: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Altura (cm ou m)</Label>
              <Input
                placeholder="173 ou 1,73"
                value={heightRaw}
                disabled={readOnly}
                onChange={(e) => handleHeightChange(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex gap-2 sm:justify-end">
          {readOnly ? (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Fechar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Salvar Triagem
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
