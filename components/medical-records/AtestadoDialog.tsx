'use client';

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { downloadAtestadoPdf } from '@/actions/document-actions';

interface AtestadoDialogProps {
  open: boolean;
  onClose: () => void;
  appointmentId: string;
}

export function AtestadoDialog({ open, onClose, appointmentId }: AtestadoDialogProps) {
  const [dias, setDias] = useState('1');
  const [motivo, setMotivo] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    const diasNum = parseInt(dias, 10);
    if (!diasNum || diasNum < 1) {
      toast.error('Informe um número válido de dias (mínimo 1)');
      return;
    }
    setGenerating(true);
    const result = await downloadAtestadoPdf(appointmentId, diasNum, motivo || undefined);
    setGenerating(false);
    if (result.success) {
      toast.success('Atestado gerado');
      onClose();
    } else {
      toast.error(result.error || 'Erro ao gerar atestado');
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setDias('1');
      setMotivo('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Emitir Atestado Médico</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dias">Dias de afastamento</Label>
            <Input
              id="dias"
              type="number"
              min={1}
              value={dias}
              onChange={(e) => setDias(e.target.value)}
              placeholder="Ex: 3"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="motivo">
              Motivo / CID <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="motivo"
              placeholder="Ex: Gripe — CID J11"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gerar Atestado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
