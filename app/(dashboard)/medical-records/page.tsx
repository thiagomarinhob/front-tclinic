'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Search, Filter, X, Eye, Paperclip } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { listMedicalRecordsAction } from '@/actions/medical-record-actions';
import { AttachmentsDialog } from '@/components/medical-records/AttachmentsDialog';
import type { MedicalRecordListItem, PaginatedResponse } from '@/types';

const PAGE_SIZE = 20;

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function MedicalRecordsPage() {
  const [page, setPage] = useState(0);
  const [patientName, setPatientName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [appliedPatientName, setAppliedPatientName] = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');
  const [data, setData] = useState<PaginatedResponse<MedicalRecordListItem> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attachmentAppointmentId, setAttachmentAppointmentId] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await listMedicalRecordsAction(page, PAGE_SIZE, {
      patientName: appliedPatientName.trim() || undefined,
      dateFrom: appliedDateFrom || undefined,
      dateTo: appliedDateTo || undefined,
    });
    if (result.success && result.data) {
      setData(result.data);
    } else {
      setError(result.error ?? 'Erro ao carregar prontuários');
      setData(null);
    }
    setIsLoading(false);
  }, [page, appliedPatientName, appliedDateFrom, appliedDateTo]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const applyFilters = useCallback(() => {
    setAppliedPatientName(patientName);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setPage(0);
  }, [patientName, dateFrom, dateTo]);

  const clearFilters = useCallback(() => {
    setPatientName('');
    setDateFrom('');
    setDateTo('');
    setAppliedPatientName('');
    setAppliedDateFrom('');
    setAppliedDateTo('');
    setPage(0);
  }, []);

  const hasFilters = patientName.trim() !== '' || dateFrom !== '' || dateTo !== '';

  const content = data?.content ?? [];
  const pagination = data;

  return (
    <>
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prontuários</h1>
        <p className="text-muted-foreground">
          Listagem de prontuários. Profissionais veem apenas os seus; a clínica vê todos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Nome do paciente</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Data agendamento (de)</label>
              <DatePicker
                value={dateFrom}
                onChange={setDateFrom}
                placeholder="Selecione a data"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Data agendamento (até)</label>
              <DatePicker
                value={dateTo}
                onChange={setDateTo}
                placeholder="Selecione a data"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={applyFilters} className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtrar
              </Button>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
          {pagination && pagination.totalElements > 0 && (
            <p className="text-sm text-muted-foreground">
              {pagination.totalElements}{' '}
              {pagination.totalElements === 1 ? 'prontuário encontrado' : 'prontuários encontrados'}
              {pagination.totalPages > 1 && (
                <span className="ml-2">(Página {pagination.number + 1} de {pagination.totalPages})</span>
              )}
            </p>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : !content.length ? (
        <Card className="p-8">
          <EmptyState
            title="Nenhum prontuário encontrado"
            description={
              hasFilters
                ? 'Nenhum prontuário corresponde aos filtros. Ajuste e tente novamente.'
                : 'Os prontuários criados nos atendimentos aparecerão aqui.'
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
                  <TableHead>Paciente</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Data agendamento</TableHead>
                  <TableHead>Data criação</TableHead>
                  <TableHead>Assinado</TableHead>
                  <TableHead className="w-[110px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.patientName ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{item.professionalName ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(item.scheduledAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(item.createdAt)}
                    </TableCell>
                    <TableCell>
                      {item.signedAt ? (
                        <span className="text-green-600 text-sm">Sim</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Não</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild title="Ver prontuário">
                          <Link href={`/medical-records/${item.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Ver anexos"
                          onClick={() => setAttachmentAppointmentId(item.appointmentId)}
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </div>
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
                <p className="text-sm text-muted-foreground">
                  Mostrando {page * PAGE_SIZE + 1} a{' '}
                  {Math.min((page + 1) * PAGE_SIZE, pagination.totalElements)} de {pagination.totalElements}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    Página {page + 1} de {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
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

    {attachmentAppointmentId && (
      <AttachmentsDialog
        open={!!attachmentAppointmentId}
        onClose={() => setAttachmentAppointmentId(null)}
        appointmentId={attachmentAppointmentId}
      />
    )}
    </>
  );
}
