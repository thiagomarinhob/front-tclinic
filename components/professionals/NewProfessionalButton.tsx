'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ProfessionalDialog } from './ProfessionalDialog';

export function NewProfessionalButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Novo Profissional
      </Button>
      <ProfessionalDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
