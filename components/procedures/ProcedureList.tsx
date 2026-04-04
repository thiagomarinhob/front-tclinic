'use client'

import { useState, useCallback } from 'react';
import { useProcedures } from '@/hooks/useProcedures';
import { useProfessionals } from '@/hooks/useProfessionals';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Search, Eye, Edit, Filter, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import type { Procedure } from '@/types/procedure.types';
import { formatCurrency } from '@/lib/utils';

const PAGE_SIZE = 10;

interface ProcedureListProps {
  professionalId?: string;
  onEdit?: (procedure: Procedure) => void;
}

export function ProcedureList({ professionalId, onEdit }: ProcedureListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [professionalFilter, setProfessionalFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState<Procedure | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 500);
  const { user } = useAuth();
  const tenantId = user?.clinicId || null;

  const activeFilter =
    statusFilter === 'all' ? undefined : statusFilter === 'active';

  // Se professionalId foi passado por prop (contexto externo), usa o prop; senão usa o filtro interno
  const resolvedProfessionalId =
    professionalId ?? (professionalFilter !== 'all' ? professionalFilter : undefined);

  const { professionals } = useProfessionals();

  const { procedures, isLoading, updateProcedure, deleteProcedure, isUpdating, isDeleting } = useProcedures(
    tenantId,
    page,
    PAGE_SIZE,
    {
      search: debouncedSearch || undefined,
      active: activeFilter,
      professionalId: resolvedProfessionalId,
    }
  );

  const displayProcedures = procedures?.content ?? [];
  const pagination = procedures;
  const hasActiveFilters =
    statusFilter !== 'all' ||
    professionalFilter !== 'all' ||
    (debouncedSearch?.length ?? 0) > 0;

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setProfessionalFilter('all');
    setPage(0);
    setSelectedIds(new Set());
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(0);
    setSelectedIds(new Set());
  }, []);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value as 'all' | 'active' | 'inactive');
    setPage(0);
    setSelectedIds(new Set());
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(displayProcedures.map((p) => p.id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [displayProcedures]
  );

  const isAllSelected =
    displayProcedures.length > 0 && selectedIds.size === displayProcedures.length;
  const isSomeSelected = selectedIds.size > 0;

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    setSelectedIds(new Set());
  }, []);

  const handleStatusToggle = useCallback(
    (procedure: Procedure) => {
      updateProcedure({
        procedureId: procedure.id,
        data: { active: !procedure.active },
      });
    },
    [updateProcedure]
  );

  const handleDeleteClick = useCallback((procedure: Procedure) => {
    setProcedureToDelete(procedure);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (procedureToDelete) {
      await deleteProcedure(procedureToDelete.id);
      setDeleteDialogOpen(false);
      setProcedureToDelete(null);
    }
  }, [procedureToDelete, deleteProcedure]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {/* Busca e filtros */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou descrição..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtros:</span>
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            {!professionalId && (
              <Select value={professionalFilter} onValueChange={(value) => { setProfessionalFilter(value); setPage(0); setSelectedIds(new Set()); }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Profissional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os profissionais</SelectItem>
                  {professionals.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.user.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar filtros
              </Button>
            )}
          </div>
          {pagination && pagination.totalElements > 0 && (
            <div className="text-sm text-muted-foreground">
              {pagination.totalElements}{' '}
              {pagination.totalElements === 1 ? 'procedimento encontrado' : 'procedimentos encontrados'}
              {pagination.totalPages > 1 && (
                <span className="ml-2">
                  (Página {pagination.number + 1} de {pagination.totalPages})
                </span>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Table */}
      {!displayProcedures || displayProcedures.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            title="Nenhum procedimento encontrado"
            description={
              hasActiveFilters
                ? 'Nenhum procedimento corresponde à busca ou aos filtros. Tente ajustar.'
                : 'Adicione o primeiro procedimento da clínica'
            }
          />
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                      onCheckedChange={(checked) =>
                        toggleSelectAll(checked === true)}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Preço Base</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayProcedures.map((procedure) => (
                  <TableRow key={procedure.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(procedure.id)}
                        onCheckedChange={() => toggleSelection(procedure.id)}
                        aria-label={`Selecionar ${procedure.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{procedure.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {procedure.description ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDuration(procedure.estimatedDurationMinutes)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(procedure.basePrice)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {procedure.professionalCommissionPercent
                        ? `${procedure.professionalCommissionPercent}%`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="text-sm font-medium">
                          {procedure.active ? 'Ativo' : 'Inativo'}
                        </span>
                        <Switch
                          checked={procedure.active}
                          onCheckedChange={() => handleStatusToggle(procedure)}
                          disabled={isUpdating}
                          className="data-[state=checked]:bg-green-600"
                          aria-label={procedure.active ? 'Desativar procedimento' : 'Ativar procedimento'}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/procedures/${procedure.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {onEdit ? (
                          <Button variant="ghost" size="icon" onClick={() => onEdit(procedure)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/procedures/${procedure.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(procedure)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </Card>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Card className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-y-2">
                <div className="text-sm text-muted-foreground">
                  Mostrando {page * PAGE_SIZE + 1} a{' '}
                  {Math.min((page + 1) * PAGE_SIZE, pagination.totalElements)} de{' '}
                  {pagination.totalElements}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 0}
                  >
                    Anterior
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        let pageNum: number;
                        if (pagination.totalPages <= 5) {
                          pageNum = i;
                        } else if (page < 3) {
                          pageNum = i;
                        } else if (page > pagination.totalPages - 4) {
                          pageNum = pagination.totalPages - 5 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="min-w-[40px]"
                          >
                            {pageNum + 1}
                          </Button>
                        );
                      }
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= pagination.totalPages - 1}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Excluir procedimento"
        description={`Tem certeza que deseja excluir o procedimento "${procedureToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
}
