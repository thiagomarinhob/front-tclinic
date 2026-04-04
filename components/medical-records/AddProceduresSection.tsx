'use client';

import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, X, History, Stethoscope, Save } from 'lucide-react';
import { toast } from 'sonner';
import { getAllProceduresAction } from '@/actions/procedure-actions';
import { updateAppointmentAction } from '@/actions/appointment-actions';
import type { AppointmentProcedure, Procedure } from '@/types';

interface AddProceduresSectionProps {
  appointmentId: string;
  tenantId: string | null;
  professionalId?: string | null;
  currentProcedures: AppointmentProcedure[];
  onHistoryClick?: () => void;
}

export function AddProceduresSection({
  appointmentId,
  tenantId,
  professionalId,
  currentProcedures,
  onHistoryClick,
}: AddProceduresSectionProps) {
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    currentProcedures.map((p) => p.id)
  );
  const [catalogCache, setCatalogCache] = useState<Record<string, Procedure>>({});

  const [search, setSearch] = useState('');
  const [catalog, setCatalog] = useState<Procedure[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync quando o appointment atualiza (ex: navegou para cá e já tinha procedimentos)
  useEffect(() => {
    setSelectedIds(currentProcedures.map((p) => p.id));
    setIsDirty(false);
  }, [currentProcedures]);

  // Carrega catálogo com debounce
  useEffect(() => {
    if (!tenantId || !showDropdown) return;
    let cancelled = false;

    async function load() {
      setLoadingCatalog(true);
      const result = await getAllProceduresAction(tenantId!, 0, 50, {
        search: search.trim() || undefined,
        active: true,
        professionalId: professionalId ?? undefined,
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
  }, [tenantId, search, showDropdown, professionalId]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdd = (proc: Procedure) => {
    if (selectedIds.includes(proc.id)) return;
    setSelectedIds((prev) => [...prev, proc.id]);
    setCatalogCache((prev) => ({ ...prev, [proc.id]: proc }));
    setIsDirty(true);
    setSearch('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleRemove = (id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateAppointmentAction(appointmentId, { procedureIds: selectedIds });
    setSaving(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
      toast.success('Procedimentos atualizados com sucesso');
      setIsDirty(false);
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Adicionar Procedimentos
          </CardTitle>
          <div className="flex items-center gap-2">
            {isDirty && (
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                Salvar
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onHistoryClick} title="Ver histórico do paciente">
              <History className="mr-1.5 h-3.5 w-3.5" />
              Histórico
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            placeholder="Buscar e adicionar procedimento..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="pl-9"
            disabled={!tenantId}
          />

          {/* Dropdown de sugestões */}
          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute z-50 left-0 right-0 top-full mt-1 bg-popover border rounded-md shadow-md max-h-56 overflow-auto"
            >
              {loadingCatalog ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : catalogAvailable.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3 px-4">
                  {search
                    ? 'Nenhum resultado encontrado'
                    : selectedIds.length > 0
                    ? 'Todos os procedimentos já foram adicionados'
                    : 'Nenhum procedimento cadastrado'}
                </p>
              ) : (
                catalogAvailable.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-accent text-left transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault(); // evita blur no input antes do click
                      handleAdd(p);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {p.basePrice.toFixed(2).replace('.', ',')}
                        {p.estimatedDurationMinutes > 0 && (
                          <span className="ml-2">{p.estimatedDurationMinutes} min</span>
                        )}
                      </p>
                    </div>
                    <Plus className="h-4 w-4 text-primary shrink-0 ml-3" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Procedimentos selecionados */}
        {selectedProcedures.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {selectedProcedures.map((p) => (
                <Badge
                  key={p.id}
                  variant="secondary"
                  className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 text-sm"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground text-xs">
                    R$ {p.value.toFixed(2).replace('.', ',')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(p.id)}
                    className="ml-0.5 rounded-full hover:bg-destructive/20 hover:text-destructive p-0.5 transition-colors"
                    title="Remover procedimento"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <p className="text-sm font-semibold text-right">
              Total: R$ {totalValue.toFixed(2).replace('.', ',')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
