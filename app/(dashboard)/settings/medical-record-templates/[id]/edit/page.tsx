'use client';

import { useAuthContext } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { getProfessionalByUserIdAction } from '@/actions/professional-actions';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MedicalRecordTemplateEditorPage } from '@/components/settings/MedicalRecordTemplateEditorPage';

export default function EditMedicalRecordTemplatePage() {
  const { user } = useAuthContext();
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : null;
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const tenantId = user?.clinicId ?? null;
  const isProfessional = user?.role === UserRole.PROFISSIONAL_SAUDE;

  useEffect(() => {
    if (!tenantId || !id) {
      if (!tenantId) router.replace('/settings');
      return;
    }
    if (isProfessional && user?.id) {
      getProfessionalByUserIdAction(user.id).then((res) => {
        if (res.success && res.data) setProfessionalId(res.data.id);
      });
    }
  }, [tenantId, id, isProfessional, user?.id, router]);

  if (!tenantId || !id) return null;

  return (
    <MedicalRecordTemplateEditorPage
      templateId={id}
      tenantId={tenantId}
      professionalId={professionalId}
      isProfessional={isProfessional}
    />
  );
}
