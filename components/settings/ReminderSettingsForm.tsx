'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, BellRing } from 'lucide-react';
import { toast } from 'sonner';
import {
  getReminderSettingsAction,
  updateConfirmationWindowAction,
} from '@/actions/reminder-settings-actions';

const MIN_MINUTES = 60;
const MAX_MINUTES = 2880;

const HOUR_OPTIONS = [1, 2, 3, 4, 6, 8, 12, 18, 24, 36, 48];

export function ReminderSettingsForm() {
  const [minutes, setMinutes] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await getReminderSettingsAction();
      if (cancelled) return;
      if (result.success && result.data) {
        setMinutes(result.data.confirmationWindowMinutes);
      } else {
        toast.error(result.error || 'Erro ao carregar configuração de lembrete');
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleChange(value: string) {
    const newMinutes = Number(value) * 60;
    if (newMinutes === minutes) return;

    const previous = minutes;
    setMinutes(newMinutes);
    setSaving(true);

    const result = await updateConfirmationWindowAction(newMinutes);
    if (result.success) {
      toast.success('Antecedência do lembrete atualizada com sucesso');
    } else {
      setMinutes(previous);
      toast.error(result.error || 'Erro ao atualizar antecedência do lembrete');
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const selectedHours = minutes !== null && minutes % 60 === 0 ? String(minutes / 60) : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BellRing className="h-4 w-4" />
          Lembrete de Confirmação por WhatsApp
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Defina com quanta antecedência, antes do horário da consulta, o lembrete de
          confirmação será enviado ao paciente por WhatsApp.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label htmlFor="confirmation-window">Antecedência do lembrete</Label>
        <div className="flex items-center gap-3">
          <Select value={selectedHours} onValueChange={handleChange} disabled={saving}>
            <SelectTrigger id="confirmation-window" className="w-[220px]">
              <SelectValue placeholder="Selecione a antecedência" />
            </SelectTrigger>
            <SelectContent>
              {HOUR_OPTIONS.map((hours) => (
                <SelectItem key={hours} value={String(hours)}>
                  {hours} {hours === 1 ? 'hora' : 'horas'} antes
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <p className="text-xs text-muted-foreground">
          Mínimo de {MIN_MINUTES / 60} hora e máximo de {MAX_MINUTES / 60} horas de antecedência.
        </p>
      </CardContent>
    </Card>
  );
}
