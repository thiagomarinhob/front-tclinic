'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AppointmentDialog } from './AppointmentDialog';

export function NewAppointmentButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Novo Agendamento
      </Button>
      <AppointmentDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
