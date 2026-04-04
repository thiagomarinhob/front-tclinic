'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2, FlaskConical } from 'lucide-react';
import { getLabExamTypesAction, deleteLabExamTypeAction } from '@/actions/laboratory-actions';
import { ExamTypeForm } from './ExamTypeForm';
import type { LabExamType, PaginatedResponse } from '@/types';

const SECTOR_LABELS: Record<string, string> = {
  HEMATOLOGY: 'Hematologia',
  BIOCHEMISTRY: 'Bioquímica',
  IMMUNOLOGY: 'Imunologia',
  MICROBIOLOGY: 'Microbiologia',
  URINALYSIS: 'Urinálise',
  PARASITOLOGY: 'Parasitologia',
  HORMONES: 'Hormônios',
  COAGULATION: 'Coagulação',
  OTHER: 'Outros',
};

export function ExamTypeList() {
  const [search, setSearch] = useState('');
  const [data, setData] = useState<PaginatedResponse<LabExamType> | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LabExamType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    const result = await getLabExamTypesAction(0, 100, { search: search || undefined });
    if (result.success && result.data) setData(result.data);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchTypes, 300);
    return () => clearTimeout(t);
  }, [fetchTypes]);

  async function handleDelete(id: string) {
    const result = await deleteLabExamTypeAction(id);
    if (result.success) {
      toast.success('Tipo de exame excluído!');
      fetchTypes();
    } else {
      toast.error(result.error || 'Erro ao excluir');
    }
    setDeletingId(null);
  }

  function handleSaved() {
    setFormOpen(false);
    setEditing(null);
    fetchTypes();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar exame..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          Novo Tipo
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      ) : !data || data.content.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FlaskConical className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum tipo de exame cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.content.map((type) => (
            <Card key={type.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {type.code && (
                        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{type.code}</span>
                      )}
                      <span className="font-medium">{type.name}</span>
                      <Badge variant="outline">{SECTOR_LABELS[type.sector] || type.sector}</Badge>
                      {!type.active && <Badge variant="destructive">Inativo</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                      {type.unit && <span>Unidade: {type.unit}</span>}
                      {type.referenceRangeText && <span>Ref: {type.referenceRangeText}</span>}
                      {type.turnaroundHours && <span>Prazo: {type.turnaroundHours}h</span>}
                    </div>
                    {type.preparationInfo && (
                      <p className="text-xs text-muted-foreground">Preparo: {type.preparationInfo}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditing(type); setFormOpen(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingId(type.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Tipo de Exame' : 'Novo Tipo de Exame'}</DialogTitle>
          </DialogHeader>
          <ExamTypeForm examType={editing} onSaved={handleSaved} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tipo de exame?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O tipo será removido do catálogo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
