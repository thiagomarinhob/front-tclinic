'use client';

import { useState } from 'react';
import { ExamList } from '@/components/exams/ExamList';
import { ExamDialog } from '@/components/exams/ExamDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function ExamsPageContent() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Exames</h2>
          <p className="text-muted-foreground">
            Pedidos de exame e resultados da clínica
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo exame
        </Button>
      </div>

      <ExamList />

      <ExamDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
