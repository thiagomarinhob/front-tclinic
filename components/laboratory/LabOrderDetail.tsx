'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { updateLabOrderStatusAction } from '@/actions/laboratory-actions';
import { LabOrderStatusBadge, LabPriorityBadge } from './LabOrderStatusBadge';
import { LabResultEntry } from './LabResultEntry';
import type { LabOrder, LabOrderItem, LabOrderStatus } from '@/types';

const NEXT_STATUS: Partial<Record<LabOrderStatus, LabOrderStatus>> = {
  REQUESTED: 'COLLECTED',
  COLLECTED: 'RECEIVED',
  RECEIVED: 'IN_ANALYSIS',
  IN_ANALYSIS: 'COMPLETED',
};

const STATUS_ACTION_LABEL: Partial<Record<LabOrderStatus, string>> = {
  REQUESTED: 'Registrar Coleta',
  COLLECTED: 'Confirmar Recebimento',
  RECEIVED: 'Iniciar Análise',
  IN_ANALYSIS: 'Concluir Solicitação',
};

const PAYMENT_LABELS: Record<string, string> = {
  PRIVATE: 'Particular',
  HEALTH_PLAN: 'Convênio',
};

interface LabOrderDetailProps {
  initialOrder: LabOrder;
}

export function LabOrderDetail({ initialOrder }: LabOrderDetailProps) {
  const [order, setOrder] = useState<LabOrder>(initialOrder);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<LabOrderStatus | null>(null);
  const [sampleCode, setSampleCode] = useState(order.sampleCode ?? '');
  const [collectedBy, setCollectedBy] = useState(order.collectedBy ?? '');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  function handleItemUpdated(updated: LabOrderItem) {
    setOrder((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === updated.id ? updated : i)),
    }));
  }

  function openStatusDialog() {
    const ns = NEXT_STATUS[order.status as LabOrderStatus];
    if (!ns) return;
    setNextStatus(ns);
    setStatusDialogOpen(true);
  }

  async function confirmStatusUpdate() {
    if (!nextStatus) return;
    setUpdatingStatus(true);
    const result = await updateLabOrderStatusAction(order.id, {
      status: nextStatus,
      sampleCode: sampleCode || undefined,
      collectedBy: collectedBy || undefined,
    });
    setUpdatingStatus(false);
    if (result.success && result.data) {
      setOrder(result.data);
      setStatusDialogOpen(false);
      toast.success('Status atualizado!');
    } else {
      toast.error(result.error || 'Erro ao atualizar status');
    }
  }

  const formatDateTime = (dt: string | null) =>
    dt
      ? new Date(dt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '—';

  const actionLabel = STATUS_ACTION_LABEL[order.status as LabOrderStatus];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">{order.patientName}</h2>
              <LabOrderStatusBadge status={order.status as LabOrderStatus} />
              <LabPriorityBadge priority={order.priority} />
            </div>
            {order.sampleCode && (
              <p className="text-sm text-muted-foreground font-mono">
                Código da amostra: <span className="font-bold">{order.sampleCode}</span>
              </p>
            )}
          </div>
          {actionLabel && (
            <Button onClick={openStatusDialog}>{actionLabel}</Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-sm">
            <div>
              <p className="text-muted-foreground">Solicitante</p>
              <p>{order.requesterName || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Pagamento</p>
              <p>{PAYMENT_LABELS[order.paymentType]}{order.healthPlanName ? ` — ${order.healthPlanName}` : ''}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Coletado por</p>
              <p>{order.collectedBy || '—'} {order.collectedAt ? `em ${formatDateTime(order.collectedAt)}` : ''}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Recebido em</p>
              <p>{formatDateTime(order.receivedAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Criado em</p>
              <p>{formatDateTime(order.createdAt)}</p>
            </div>
            {order.clinicalNotes && (
              <div className="md:col-span-2 lg:col-span-3">
                <p className="text-muted-foreground">Observações Clínicas</p>
                <p className="whitespace-pre-wrap">{order.clinicalNotes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exams and Results */}
      <div>
        <h3 className="text-lg font-semibold mb-3">
          Exames e Resultados ({order.items.length})
        </h3>
        <div className="space-y-3">
          {order.items.map((item) => (
            <LabResultEntry
              key={item.id}
              item={item}
              onUpdated={handleItemUpdated}
            />
          ))}
        </div>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {nextStatus === 'COLLECTED' && (
              <>
                <div className="space-y-2">
                  <Label>Código da Amostra</Label>
                  <Input
                    value={sampleCode}
                    onChange={(e) => setSampleCode(e.target.value)}
                    placeholder="Código de barras ou identificador"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Coletado por</Label>
                  <Input
                    value={collectedBy}
                    onChange={(e) => setCollectedBy(e.target.value)}
                    placeholder="Nome do profissional que coletou"
                  />
                </div>
              </>
            )}
            <p className="text-sm text-muted-foreground">
              O status da solicitação será atualizado para <strong>{nextStatus && STATUS_LABEL[nextStatus]}</strong>.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancelar</Button>
            <Button onClick={confirmStatusUpdate} disabled={updatingStatus}>
              {updatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const STATUS_LABEL: Record<LabOrderStatus, string> = {
  REQUESTED: 'Solicitado',
  COLLECTED: 'Coletado',
  RECEIVED: 'Recebido',
  IN_ANALYSIS: 'Em Análise',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};
