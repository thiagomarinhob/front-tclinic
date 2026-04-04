'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { getAllProceduresAction } from '@/actions/procedure-actions';
import { updateAppointmentAction } from '@/actions/appointment-actions';
import type { AppointmentProcedure, Procedure } from '@/types';

interface ProceduresDialogProps {
  open: boolean;
  onClose: () => void;
  appointmentId: string;
  tenantId: string | null;
  currentProcedures: AppointmentProcedure[];
}

export function ProceduresDialog({
  open,
  onClose,
  appointmentId,
  tenantId,
  currentProcedures,
}: ProceduresDialogProps) {
  const queryClient = useQueryClient();

  // IDs dos procedimentos selecionados
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Cache de objetos para exibir nome/valor dos selecionados que vieram do catálogo
  const [catalogCache, setCatalogCache] = useState<Record<string, Procedure>>({});

  const [search, setSearch] = useState('');
  const [catalog, setCatalog] = useState<Procedure[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [saving, setSaving] = useState(false);

  // Inicializa ao abrir
  useEffect(() => {
    if (open) {
      setSelectedIds(currentProcedures.map((p) => p.id));
      setSearch('');
      setCatalogCache({});
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Carrega catálogo com debounce
  useEffect(() => {
    if (!open || !tenantId) return;
    let cancelled = false;

    async function load() {
      setLoadingCatalog(true);
      const result = await getAllProceduresAction(tenantId!, 0, 30, {
        search: search.trim() || undefined,
        active: true,
      });
      if (!cancelled) {
        setCatalog(result.success ? (result.data?.content ?? []) : []);
        setLoadingCatalog(false);
      }
    }

    const timer = setTimeout(load, search ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, tenantId, search]);

  const handleAdd = (proc: Procedure) => {
    setSelectedIds((prev) => [...prev, proc.id]);
    setCatalogCache((prev) => ({ ...prev, [proc.id]: proc }));
  };

  const handleRemove = (id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateAppointmentAction(appointmentId, { procedureIds: selectedIds });
    setSaving(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
      toast.success('Procedimentos atualizados com sucesso');
      onClose();
    } else {
      toast.error(result.error ?? 'Erro ao salvar procedimentos');
    }
  };

  // Monta lista de selecionados com nome/valor resolvidos
  const selectedProcedures = selectedIds.map((id) => {
    const fromCurrent = currentProcedures.find((p) => p.id === id);
    const fromCache = catalogCache[id];
    const fromCatalog = catalog.find((p) => p.id === id);
    return {
      id,
      name: fromCurrent?.name ?? fromCache?.name ?? fromCatalog?.name ?? '—',
      value: fromCurrent?.value ?? fromCache?.basePrice ?? fromCatalog?.basePrice ?? 0,
    };
  });

  const totalValue = selectedProcedures.reduce((sum, p) => sum + p.value, 0);

  // Catálogo sem os já selecionados
  const catalogAvailable = catalog.filter((p) => !selectedIds.includes(p.id));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Procedimentos do Atendimento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Procedimentos selecionados */}
          <div>
            <p className="text-sm font-medium mb-2">
              Selecionados
              {selectedProcedures.length > 0 && (
                <span className="ml-1 text-muted-foreground font-normal">
                  ({selectedProcedures.length})
                </span>
              )}
            </p>
            {selectedProcedures.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 border rounded-md">
                Nenhum procedimento selecionado
              </p>
            ) : (
              <div className="border rounded-md divide-y">
                {selectedProcedures.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {p.value.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(p.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {selectedProcedures.length > 0 && (
              <p className="text-sm font-semibold text-right mt-2">
                Total: R$ {totalValue.toFixed(2).replace('.', ',')}
              </p>
            )}
          </div>

          <Separator />

          {/* Busca no catálogo */}
          <div>
            <p className="text-sm font-medium mb-2">Adicionar procedimento</p>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar no catálogo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {loadingCatalog ? (
              <div className="flex justify-center py-5">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : catalogAvailable.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {search
                  ? 'Nenhum resultado encontrado'
                  : 'Todos os procedimentos do catálogo já foram adicionados'}
              </p>
            ) : (
              <ScrollArea className="max-h-52">
                <div className="border rounded-md divide-y">
                  {catalogAvailable.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-3 py-2.5">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          R$ {p.basePrice.toFixed(2).replace('.', ',')}
                          {p.estimatedDurationMinutes > 0 && (
                            <span className="ml-2">{p.estimatedDurationMinutes} min</span>
                          )}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs shrink-0"
                        onClick={() => handleAdd(p)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
