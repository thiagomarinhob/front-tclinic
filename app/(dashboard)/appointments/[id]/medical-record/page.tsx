'use client'

import { useParams } from 'next/navigation';
import { MedicalRecordPage } from '@/components/medical-records/MedicalRecordPage';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function MedicalRecordRoute() {
  const params = useParams();
  const appointmentId = params?.id as string;

  if (!appointmentId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  return <MedicalRecordPage appointmentId={appointmentId} />;
}
