'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ProcedureList } from '@/components/procedures/ProcedureList';
import { ProcedureDialog } from '@/components/procedures/ProcedureDialog';
import type { Procedure } from '@/types';

export default function ProceduresPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | undefined>();

  const handleNewProcedure = () => {
    setSelectedProcedure(undefined);
    setDialogOpen(true);
  };

  const handleEditProcedure = (procedure: Procedure) => {
    setSelectedProcedure(procedure);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Procedimentos</h2>
          <p className="text-muted-foreground">
            Gerencie os procedimentos da clínica
          </p>
        </div>
        <Button onClick={handleNewProcedure}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Procedimento
        </Button>
      </div>

      <ProcedureList onEdit={handleEditProcedure} />

      <ProcedureDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        procedure={selectedProcedure}
      />
    </div>
  );
}
