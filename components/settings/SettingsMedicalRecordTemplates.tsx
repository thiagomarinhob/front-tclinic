'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Plus, Pencil, Trash2, Loader2, Star } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { ROUTES } from '@/config/constants';
import {
  getMedicalRecordTemplatesAction,
  setMedicalRecordTemplateAsDefaultAction,
  deleteMedicalRecordTemplateAction,
} from '@/actions/medical-record-template-actions';
import { getProfessionalByUserIdAction } from '@/actions/professional-actions';
import { toast } from 'sonner';
import type { MedicalRecordTemplate } from '@/types';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

function templateOrigin(t: MedicalRecordTemplate): 'Sistema' | 'Clínica' | 'Meu' {
  if (t.readOnly || t.tenantId == null) return 'Sistema';
  if (t.professionalId) return 'Meu';
  return 'Clínica';
}

export function SettingsMedicalRecordTemplates() {
  const { user } = useAuthContext();
  const [templates, setTemplates] = useState<MedicalRecordTemplate[]>([]);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const tenantId = user?.clinicId ?? null;
  const isProfessional = user?.role === UserRole.PROFISSIONAL_SAUDE;

  const loadProfessionalId = useCallback(async () => {
    if (!user?.id || !isProfessional) return;
    const res = await getProfessionalByUserIdAction(user.id);
    if (res.success && res.data) setProfessionalId(res.data.id);
  }, [user?.id, isProfessional]);

  const loadTemplates = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await getMedicalRecordTemplatesAction(
      tenantId,
      false,
      undefined,
      professionalId ?? undefined
    );
    if (res.success && res.data) setTemplates(res.data);
    else setTemplates([]);
    setLoading(false);
  }, [tenantId, professionalId]);

  useEffect(() => {
    loadProfessionalId();
  }, [loadProfessionalId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleSetAsDefault = async (id: string) => {
    setSettingDefaultId(id);
    const res = await setMedicalRecordTemplateAsDefaultAction(id);
    setSettingDefaultId(null);
    if (res.success) {
      toast.success('Modelo definido como padrão.');
      loadTemplates();
    } else {
      toast.error(res.error ?? 'Erro ao definir padrão.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const res = await deleteMedicalRecordTemplateAction(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (res.success) {
      toast.success('Modelo excluído.');
      loadTemplates();
    } else {
      toast.error(res.error ?? 'Erro ao excluir.');
    }
  };

  if (!tenantId) return null;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Prontuários personalizados
          </CardTitle>
          {!loading && (
            <Button size="sm" asChild>
              <Link href={ROUTES.SETTINGS_MEDICAL_RECORD_TEMPLATES_NEW}>
                <Plus className="h-4 w-4 mr-1" />
                Novo modelo
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Nenhum modelo de prontuário. Crie um para definir os campos e a ordem de preenchimento.
            </p>
          ) : (
            <ul className="space-y-2">
              {templates.map((t) => {
                const origin = templateOrigin(t);
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.name}</span>
                      {t.defaultTemplate && (
                        <Badge variant="default" className="gap-0.5">
                          <Star className="h-3 w-3 fill-current" />
                          Padrão
                        </Badge>
                      )}
                      <Badge variant={origin === 'Sistema' ? 'secondary' : origin === 'Meu' ? 'default' : 'outline'}>
                        {origin}
                      </Badge>
                      {t.professionalType && (
                        <span className="text-xs text-muted-foreground">{t.professionalType}</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {!t.defaultTemplate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Definir como padrão"
                          onClick={() => handleSetAsDefault(t.id)}
                          disabled={!!settingDefaultId}
                        >
                          {settingDefaultId === t.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Star className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {!t.readOnly && (
                        <>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={ROUTES.SETTINGS_MEDICAL_RECORD_TEMPLATES_EDIT(t.id)}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeleteId(t.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir modelo"
        description="Este modelo de prontuário será removido. Prontuários já preenchidos com ele não são apagados."
        confirmText="Excluir"
        variant="destructive"
        isLoading={deleting}
      />
    </>
  );
}
