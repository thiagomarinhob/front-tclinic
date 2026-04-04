'use client';

import { useState, useCallback } from 'react';
import { useExams } from '@/hooks/useExams';
import { Card } from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { Eye, Filter, X } from 'lucide-react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import type { Exam, ExamStatus } from '@/types/exam.types';

const PAGE_SIZE = 10;

const STATUS_LABELS: Record<ExamStatus, string> = {
  REQUESTED: 'Solicitado',
  PENDING_RESULT: 'Aguardando resultado',
  COMPLETED: 'Concluído',
};

export function ExamList() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const statusParam = statusFilter === 'all' ? undefined : statusFilter;

  const { exams, isLoading } = useExams(page, PAGE_SIZE, {
    status: statusParam,
  });

  const content = exams?.content ?? [];
  const pagination = exams;
  const hasActiveFilters = statusFilter !== 'all';

  const clearFilters = useCallback(() => {
    setStatusFilter('all');
    setPage(0);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtros:</span>
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="REQUESTED">Solicitado</SelectItem>
              <SelectItem value="PENDING_RESULT">Aguardando resultado</SelectItem>
              <SelectItem value="COMPLETED">Concluído</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="h-4 w-4 mr-1" />
              Limpar filtros
            </Button>
          )}
          {pagination && pagination.totalElements > 0 && (
            <div className="text-sm text-muted-foreground ml-auto">
              {pagination.totalElements}{' '}
              {pagination.totalElements === 1 ? 'exame encontrado' : 'exames encontrados'}
              {pagination.totalPages > 1 && (
                <span className="ml-2">
                  (Página {pagination.number + 1} de {pagination.totalPages})
                </span>
              )}
            </div>
          )}
        </div>
      </Card>

      {!content.length ? (
        <Card className="p-8">
          <EmptyState
            title="Nenhum exame encontrado"
            description={
              hasActiveFilters
                ? 'Nenhum exame corresponde aos filtros. Tente ajustar.'
                : 'Os pedidos de exame aparecerão aqui. Crie um exame a partir do prontuário do paciente.'
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
                  <TableHead>Exame</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.map((exam: Exam) => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium">{exam.name}</TableCell>
                    <TableCell>
                      <Link
                        href={`/patients/${exam.patientId}`}
                        className="text-primary hover:underline"
                      >
                        {exam.patientFirstName ?? exam.patientId}
                      </Link>
                    </TableCell>
                    <TableCell>{STATUS_LABELS[exam.status]}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(exam.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/exams/${exam.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </Card>

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
