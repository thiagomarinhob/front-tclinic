'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight, Eye, FlaskConical } from 'lucide-react';
import { getLabOrdersAction } from '@/actions/laboratory-actions';
import { LabOrderStatusBadge, LabPriorityBadge } from './LabOrderStatusBadge';
import { ROUTES } from '@/config/constants';
import type { LabOrder, LabOrderStatus, PaginatedResponse } from '@/types';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Todos os status' },
  { value: 'REQUESTED', label: 'Solicitado' },
  { value: 'COLLECTED', label: 'Coletado' },
  { value: 'RECEIVED', label: 'Recebido' },
  { value: 'IN_ANALYSIS', label: 'Em Análise' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

export function LabOrderList() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PaginatedResponse<LabOrder> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const result = await getLabOrdersAction(page, 20, {
      search: search || undefined,
      status: status !== 'ALL' ? status : undefined,
    });
    if (result.success && result.data) setData(result.data);
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => {
    const t = setTimeout(fetchOrders, 300);
    return () => clearTimeout(t);
  }, [fetchOrders]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente ou código..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Carregando solicitações...</p>
          </CardContent>
        </Card>
      ) : !data || data.content.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FlaskConical className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhuma solicitação laboratorial encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {data.content.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{order.patientName}</span>
                        <LabOrderStatusBadge status={order.status as LabOrderStatus} />
                        <LabPriorityBadge priority={order.priority} />
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                        {order.sampleCode && (
                          <span>Código: <span className="font-mono">{order.sampleCode}</span></span>
                        )}
                        <span>{order.items.length} exame{order.items.length !== 1 ? 's' : ''}</span>
                        {order.requesterName && <span>Solicitante: {order.requesterName}</span>}
                        <span>Criado em {formatDate(order.createdAt)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {order.items.slice(0, 4).map((item) => (
                          <span key={item.id} className="text-xs bg-muted px-2 py-0.5 rounded">
                            {item.examName}
                          </span>
                        ))}
                        {order.items.length > 4 && (
                          <span className="text-xs text-muted-foreground">+{order.items.length - 4} mais</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(ROUTES.LABORATORY_ORDER_DETAIL(order.id))}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {data.number + 1} de {data.totalPages} ({data.totalElements} solicitações)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.number === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.number >= data.totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
