'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Pencil, Check, X, Power } from 'lucide-react';
import {
  getHealthPlansAction,
  createHealthPlanAction,
  updateHealthPlanAction,
  toggleHealthPlanActiveAction,
  type HealthPlan,
} from '@/actions/health-plan-actions';

export function HealthPlanList() {
  const [plans, setPlans] = useState<HealthPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await getHealthPlansAction();
    if (res.success && res.data) setPlans(res.data);
    setLoading(false);
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await createHealthPlanAction(newName.trim());
    if (res.success && res.data) {
      setPlans((prev) => [...prev, res.data!].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
      toast.success('Convênio cadastrado com sucesso');
    } else {
      toast.error(res.error || 'Erro ao cadastrar convênio');
    }
    setCreating(false);
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return;
    const res = await updateHealthPlanAction(id, editName.trim());
    if (res.success && res.data) {
      setPlans((prev) =>
        prev.map((p) => (p.id === id ? res.data! : p)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
      toast.success('Convênio atualizado');
    } else {
      toast.error(res.error || 'Erro ao atualizar convênio');
    }
  }

  async function handleToggle(id: string) {
    const res = await toggleHealthPlanActiveAction(id);
    if (res.success && res.data) {
      setPlans((prev) => prev.map((p) => (p.id === id ? res.data! : p)));
    } else {
      toast.error(res.error || 'Erro ao alterar status');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Convênios Cadastrados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cadastrar novo */}
        <div className="flex gap-2">
          <Input
            placeholder="Nome do convênio (ex: Unimed, Bradesco Saúde...)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>

        {/* Lista */}
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum convênio cadastrado ainda.</p>
        ) : (
          <div className="divide-y rounded-md border">
            {plans.map((plan) => (
              <div key={plan.id} className="flex items-center gap-3 px-4 py-3">
                {editingId === plan.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate(plan.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="h-8 text-sm"
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleUpdate(plan.id)}>
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{plan.name}</span>
                    <Badge variant={plan.active ? 'default' : 'secondary'}>
                      {plan.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => { setEditingId(plan.id); setEditName(plan.name); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleToggle(plan.id)}
                      title={plan.active ? 'Desativar' : 'Ativar'}
                    >
                      <Power className={`h-4 w-4 ${plan.active ? 'text-destructive' : 'text-green-600'}`} />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
