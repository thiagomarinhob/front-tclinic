'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/constants';
import { getLabOrderByIdAction } from '@/actions/laboratory-actions';
import { LabOrderDetail } from '@/components/laboratory/LabOrderDetail';
import type { LabOrder } from '@/types/laboratory.types';
import { toast } from 'sonner';

export default function LabOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<LabOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    getLabOrderByIdAction(orderId).then((result) => {
      if (result.success && result.data) {
        setOrder(result.data);
      } else {
        toast.error(result.error || 'Solicitação não encontrada');
        router.push(ROUTES.LABORATORY_ORDERS);
      }
      setIsLoading(false);
    });
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={ROUTES.LABORATORY_ORDERS}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Solicitações
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Solicitação Laboratorial</h2>
          <p className="text-muted-foreground">Detalhes, coleta e lançamento de resultados</p>
        </div>
      </div>

      <LabOrderDetail initialOrder={order} />
    </div>
  );
}
