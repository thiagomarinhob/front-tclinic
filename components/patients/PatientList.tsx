'use client'

import { useState, useCallback } from 'react';
import { usePatients } from '@/hooks/usePatients';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Search, Eye, Edit, Filter, X } from 'lucide-react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import type { Patient } from '@/types/patient.types';

const PAGE_SIZE = 10;

export function PatientList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const debouncedSearch = useDebounce(searchQuery, 500);
  const { user } = useAuth();
  const tenantId = user?.clinicId || null;

  const activeFilter =
    statusFilter === 'all' ? undefined : statusFilter === 'active';

  const { patients, isLoading, updatePatient, isUpdating } = usePatients(
    tenantId,
    page,
    PAGE_SIZE,
    {
      search: debouncedSearch || undefined,
      active: activeFilter,
    }
  );

  const displayPatients = patients?.content ?? [];
  const pagination = patients;
  const hasActiveFilters =
    statusFilter !== 'all' || (debouncedSearch?.length ?? 0) > 0;

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setPage(0);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(0);
  }, []);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value as 'all' | 'active' | 'inactive');
    setPage(0);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleStatusToggle = useCallback(
    (patient: Patient) => {
      updatePatient({
        patientId: patient.id,
        data: { isActive: !patient.isActive },
      });
    },
    [updatePatient]
  );

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
              placeholder="Buscar por nome, CPF, telefone ou email..."
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
              {pagination.totalElements === 1 ? 'paciente encontrado' : 'pacientes encontrados'}
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
      {!displayPatients || displayPatients.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            title="Nenhum paciente encontrado"
            description={
              hasActiveFilters
                ? 'Nenhum paciente corresponde à busca ou aos filtros. Tente ajustar.'
                : 'Adicione o primeiro paciente da clínica'
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
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {patient.cpf ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {patient.phone ?? patient.whatsapp ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {patient.email ?? '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="text-sm font-medium">
                          {patient.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                        <Switch
                          checked={patient.isActive}
                          onCheckedChange={() => handleStatusToggle(patient)}
                          disabled={isUpdating}
                          className="data-[state=checked]:bg-green-600"
                          aria-label={patient.isActive ? 'Desativar paciente' : 'Ativar paciente'}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/patients/${patient.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/patients/${patient.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
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
    </div>
  );
}
