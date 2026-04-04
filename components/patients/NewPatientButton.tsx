'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PatientDialog } from './PatientDialog';

export function NewPatientButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Novo Paciente
      </Button>
      <PatientDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
