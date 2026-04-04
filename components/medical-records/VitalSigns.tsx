'use client'

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Activity, Heart, Thermometer, Wind, Weight, Edit } from 'lucide-react';
import type { VitalSigns as VitalSignsType } from '@/types';

const defaultVitalSigns: VitalSignsType = {
  bloodPressure: '',
  heartRate: 0,
  temperature: 0,
  oxygenSaturation: 0,
  weight: 0,
  height: 0,
};

interface VitalSignsProps {
  appointmentId: string;
  /** Modo controlado: valor e callback para persistir no prontuário */
  value?: VitalSignsType | null;
  onChange?: (v: VitalSignsType) => void;
}

export function VitalSigns({ appointmentId, value, onChange }: VitalSignsProps) {
  const [open, setOpen] = useState(false);
  const isControlled = value !== undefined && onChange != null;
  const [internalVitalSigns, setInternalVitalSigns] = useState<VitalSignsType>(defaultVitalSigns);

  const vitalSigns = isControlled ? (value ?? defaultVitalSigns) : internalVitalSigns;
  const setVitalSigns = isControlled
    ? (v: VitalSignsType | ((prev: VitalSignsType) => VitalSignsType)) => {
        const next = typeof v === 'function' ? v(vitalSigns) : v;
        onChange(next);
      }
    : setInternalVitalSigns;

  // Calcular IMC
  const calculateIMC = () => {
    if (vitalSigns.weight && vitalSigns.height) {
      const heightInMeters = vitalSigns.height / 100;
      return (vitalSigns.weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  };

  const imc = calculateIMC();

  const signs = [
    {
      icon: Activity,
      label: 'Pressão Arterial',
      value: vitalSigns.bloodPressure,
      unit: 'mmHg',
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/50',
    },
    {
      icon: Heart,
      label: 'Freq. Cardíaca',
      value: vitalSigns.heartRate,
      unit: 'bpm',
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-950/50',
    },
    {
      icon: Thermometer,
      label: 'Temperatura',
      value: vitalSigns.temperature,
      unit: '°C',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/50',
    },
    {
      icon: Wind,
      label: 'Saturação O₂',
      value: vitalSigns.oxygenSaturation,
      unit: '%',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
    },
    {
      icon: Weight,
      label: 'IMC',
      value: imc,
      unit: imc ? `kg/m² (${vitalSigns.weight}kg)` : '',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/50',
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base text-muted-foreground font-medium uppercase tracking-wide">
          <Activity className="h-4 w-4" />
          Sinais Vitais
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Sinais Vitais</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pressão Arterial (mmHg)</Label>
                  <Input
                    placeholder="120/80"
                    value={vitalSigns.bloodPressure}
                    onChange={(e) =>
                      setVitalSigns({ ...vitalSigns, bloodPressure: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Freq. Cardíaca (bpm)</Label>
                  <Input
                    type="number"
                    placeholder="72"
                    value={vitalSigns.heartRate}
                    onChange={(e) =>
                      setVitalSigns({ ...vitalSigns, heartRate: Number(e.target.value) })
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
                    value={vitalSigns.temperature}
                    onChange={(e) =>
                      setVitalSigns({ ...vitalSigns, temperature: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Saturação O₂ (%)</Label>
                  <Input
                    type="number"
                    placeholder="98"
                    value={vitalSigns.oxygenSaturation}
                    onChange={(e) =>
                      setVitalSigns({
                        ...vitalSigns,
                        oxygenSaturation: Number(e.target.value),
                      })
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
                    value={vitalSigns.weight}
                    onChange={(e) =>
                      setVitalSigns({ ...vitalSigns, weight: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Altura (cm)</Label>
                  <Input
                    type="number"
                    placeholder="165"
                    value={vitalSigns.height}
                    onChange={(e) =>
                      setVitalSigns({ ...vitalSigns, height: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            </div>
            <Button onClick={() => setOpen(false)}>Salvar</Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-4">
          {signs.map((sign) => {
            const Icon = sign.icon;
            return (
              <div
                key={sign.label}
                className={`${sign.bgColor} rounded-lg p-4 text-center`}
              >
                <Icon className={`h-5 w-5 mx-auto mb-2 ${sign.color}`} />
                <div className="text-xs text-muted-foreground mb-1">{sign.label}</div>
                <div className={`text-2xl font-bold ${sign.value && sign.value !== 0 ? sign.color : 'text-muted-foreground'}`}>
                  {sign.value && sign.value !== 0 ? sign.value : '--'}
                </div>
                <div className="text-xs text-muted-foreground">{sign.value && sign.value !== 0 ? sign.unit : ''}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}