'use client';

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { downloadExamesPdf } from '@/actions/document-actions';

interface ExamRequestDialogProps {
  open: boolean;
  onClose: () => void;
  appointmentId: string;
}

export function ExamRequestDialog({ open, onClose, appointmentId }: ExamRequestDialogProps) {
  const [exameInput, setExameInput] = useState('');
  const [exames, setExames] = useState<string[]>([]);
  const [indicacao, setIndicacao] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleAdd = () => {
    const trimmed = exameInput.trim();
    if (!trimmed) return;
    setExames((prev) => [...prev, trimmed]);
    setExameInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
  };

  const handleRemove = (index: number) => {
    setExames((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (exames.length === 0) {
      toast.error('Adicione ao menos um exame');
      return;
    }
    setGenerating(true);
    const result = await downloadExamesPdf(appointmentId, exames, indicacao || undefined);
    setGenerating(false);
    if (result.success) {
      toast.success('Solicitação de exames gerada');
      onClose();
    } else {
      toast.error(result.error || 'Erro ao gerar PDF');
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setExames([]);
      setExameInput('');
      setIndicacao('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Solicitação de Exames</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Input para adicionar exame */}
          <div>
            <p className="text-sm font-medium mb-2">Adicionar exame</p>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Hemograma completo"
                value={exameInput}
                onChange={(e) => setExameInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={handleAdd}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Lista de exames */}
          {exames.length > 0 && (
            <div className="border rounded-md divide-y">
              {exames.map((exame, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm">{exame}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(i)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {exames.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-3 border rounded-md">
              Nenhum exame adicionado ainda.
            </p>
          )}

          <Separator />

          {/* Indicação clínica (opcional) */}
          <div>
            <p className="text-sm font-medium mb-1">Indicação clínica <span className="text-muted-foreground font-normal">(opcional)</span></p>
            <Textarea
              placeholder="Descreva a indicação clínica..."
              value={indicacao}
              onChange={(e) => setIndicacao(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleGenerate} disabled={generating || exames.length === 0}>
            {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gerar Solicitação de Exames
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
