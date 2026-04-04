import { Badge } from '@/components/ui/badge';
import type { LabOrderStatus, LabResultStatus, LabPriority } from '@/types';

const ORDER_STATUS_CONFIG: Record<LabOrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  REQUESTED:   { label: 'Solicitado',   variant: 'outline' },
  COLLECTED:   { label: 'Coletado',     variant: 'default' },
  RECEIVED:    { label: 'Recebido',     variant: 'default' },
  IN_ANALYSIS: { label: 'Em Análise',   variant: 'secondary' },
  COMPLETED:   { label: 'Concluído',    variant: 'secondary' },
  CANCELLED:   { label: 'Cancelado',    variant: 'destructive' },
};

const RESULT_STATUS_CONFIG: Record<LabResultStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING:             { label: 'Pendente',         variant: 'outline' },
  ENTERED:             { label: 'Lançado',           variant: 'default' },
  TECHNICAL_VALIDATED: { label: 'Valid. Técnica',   variant: 'secondary' },
  RELEASED:            { label: 'Liberado',          variant: 'secondary' },
};

const PRIORITY_CONFIG: Record<LabPriority, { label: string; className: string }> = {
  ROUTINE: { label: 'Rotina', className: 'bg-gray-100 text-gray-700' },
  URGENT:  { label: 'Urgente', className: 'bg-red-100 text-red-700' },
};

export function LabOrderStatusBadge({ status }: { status: LabOrderStatus }) {
  const config = ORDER_STATUS_CONFIG[status];
  return <Badge variant={config.variant as any}>{config.label}</Badge>;
}

export function LabResultStatusBadge({ status }: { status: LabResultStatus }) {
  const config = RESULT_STATUS_CONFIG[status];
  return <Badge variant={config.variant as any}>{config.label}</Badge>;
}

export function LabPriorityBadge({ priority }: { priority: LabPriority }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
