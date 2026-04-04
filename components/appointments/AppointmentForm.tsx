'use client'

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { appointmentSchema } from '@/lib/validators';
import { useAvailability } from '@/hooks/useAvailability';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { z } from 'zod';

type AppointmentFormData = z.input<typeof appointmentSchema>;

export function AppointmentForm() {
  const { checkAvailability, isChecking } = useAvailability();
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    isAvailable: boolean;
    message: string;
  } | null>(null);

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
  });

  const professionalId = watch('professionalId');
  const scheduledAt = watch('scheduledAt');
  const durationMinutes = watch('durationMinutes') || 60;

  // Verificar disponibilidade em tempo real
  useEffect(() => {
    if (professionalId && scheduledAt) {
      const checkTimeout = setTimeout(async () => {
        const result = await checkAvailability(
          professionalId,
          scheduledAt,
          durationMinutes
        );

        if (result.success) {
          setAvailabilityStatus({
            isAvailable: result.data || false,
            message: result.data
              ? '✓ Horário disponível'
              : '✗ Profissional já possui agendamento neste horário',
          });
        }
      }, 500); 

      return () => clearTimeout(checkTimeout);
    }
  }, [professionalId, scheduledAt, durationMinutes, checkAvailability]);

  return (
    <form className="space-y-4">
      {/* ... outros campos ... */}

      {/* Feedback de disponibilidade */}
      {availabilityStatus && (
        <Alert variant={availabilityStatus.isAvailable ? 'default' : 'destructive'}>
          {availabilityStatus.isAvailable ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{availabilityStatus.message}</AlertDescription>
        </Alert>
      )}

      {/* ... resto do formulário ... */}
    </form>
  );
}