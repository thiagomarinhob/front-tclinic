'use client'

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Loader2, Package } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAllProceduresAction } from '@/actions/procedure-actions';
import { formatCurrency } from '@/lib/utils';
import { useAuthContext } from '@/contexts/AuthContext';
import { useProcedures } from '@/hooks/useProcedures';
import type { Procedure } from '@/types';

interface ComboDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComboDialog({ open, onOpenChange }: ComboDialogProps) {
  const { user } = useAuthContext();
  const tenantId = user?.clinicId || null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(['', '']);

  // Fetch all active non-combo procedures for this tenant
  const { data: proceduresResult, isLoading: loadingProcedures } = useQuery({
    queryKey: ['procedures', 'combo-catalog', tenantId],
    queryFn: () => getAllProceduresAction(tenantId!, 0, 200, { active: true }),
    enabled: !!tenantId && open,
  });

  const allProcedures: Procedure[] = useMemo(() => {
    const content = proceduresResult?.data?.content ?? [];
    return content.filter((p) => !p.isCombo);
  }, [proceduresResult]);

  const { createCombo, isCreatingCombo } = useProcedures(tenantId, 0, 1, undefined, { enabled: false });

  // Map selected IDs to procedure objects (ignore empty strings)
  const selectedProcedures = useMemo(
    () => selectedIds.map((id) => allProcedures.find((p) => p.id === id)).filter(Boolean) as Procedure[],
    [selectedIds, allProcedures]
  );

  const sumPrice = useMemo(
    () => selectedProcedures.reduce((acc, p) => acc + p.basePrice, 0),
    [selectedProcedures]
  );

  const totalDuration = useMemo(
    () => selectedProcedures.reduce((acc, p) => acc + p.estimatedDurationMinutes, 0),
    [selectedProcedures]
  );

  const parsedCustomPrice = parseFloat(customPrice.replace(',', '.')) || 0;
  const discount = sumPrice > 0 && parsedCustomPrice > 0 ? sumPrice - parsedCustomPrice : 0;

  const validSelectedIds = selectedIds.filter(Boolean);
  const canSave =
    name.trim().length >= 2 &&
    parsedCustomPrice > 0 &&
    validSelectedIds.length >= 2 &&
    new Set(validSelectedIds).size === validSelectedIds.length; // no duplicates

  const handleAddSlot = () => setSelectedIds((prev) => [...prev, '']);

  const handleRemoveSlot = (index: number) => {
    setSelectedIds((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectChange = (index: number, value: string) => {
    setSelectedIds((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setCustomPrice('');
    setSelectedIds(['', '']);
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await createCombo({
        name: name.trim(),
        description: description.trim() || undefined,
        basePrice: parsedCustomPrice,
        itemProcedureIds: validSelectedIds,
      });
      handleClose();
    } catch {
      // toast already shown by hook
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes === 0) return '—';
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  // Procedures already chosen in OTHER slots (to hide from a slot's options)
  const chosenElsewhere = (index: number): Set<string> => {
    const set = new Set<string>();
    selectedIds.forEach((id, i) => {
      if (i !== index && id) set.add(id);
    });
    return set;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Criar Combo de Procedimentos
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="combo-name">Nome do combo *</Label>
            <Input
              id="combo-name"
              placeholder="Ex: Combo Limpeza + Clareamento"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="combo-desc">Descrição (opcional)</Label>
            <Textarea
              id="combo-desc"
              placeholder="Descreva o combo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <Separator />

          {/* Seleção de procedimentos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Procedimentos do combo *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSlot}
                disabled={selectedIds.length >= 10}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            {loadingProcedures ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando procedimentos...
              </div>
            ) : (
              <div className="space-y-2">
                {selectedIds.map((selectedId, index) => {
                  const excluded = chosenElsewhere(index);
                  const options = allProcedures.filter((p) => !excluded.has(p.id));
                  const selectedProc = allProcedures.find((p) => p.id === selectedId);

                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1">
                        <Select
                          value={selectedId || '_placeholder'}
                          onValueChange={(v) => handleSelectChange(index, v === '_placeholder' ? '' : v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um procedimento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_placeholder" disabled>
                              Selecione um procedimento
                            </SelectItem>
                            {options.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                <span className="flex items-center justify-between w-full gap-4">
                                  <span>{p.name}</span>
                                  <span className="text-muted-foreground text-xs">
                                    {formatCurrency(p.basePrice)}
                                  </span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedProc && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatCurrency(selectedProc.basePrice)}
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSlot(index)}
                        disabled={selectedIds.length <= 2}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Resumo de duração + valor soma */}
            {selectedProcedures.length >= 2 && (
              <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Duração total estimada</span>
                  <span>{formatDuration(totalDuration)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Soma dos procedimentos</span>
                  <span>{formatCurrency(sumPrice)}</span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Preço do combo */}
          <div className="space-y-1.5">
            <Label htmlFor="combo-price">Preço do combo (R$) *</Label>
            <Input
              id="combo-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
            />
            {discount > 0 && (
              <p className="text-xs text-green-600">
                Economia de {formatCurrency(discount)} em relação à soma individual
              </p>
            )}
            {parsedCustomPrice > sumPrice && sumPrice > 0 && (
              <p className="text-xs text-amber-600">
                Preço acima da soma individual ({formatCurrency(sumPrice)})
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isCreatingCombo}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSave || isCreatingCombo}>
            {isCreatingCombo ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Criar Combo'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
