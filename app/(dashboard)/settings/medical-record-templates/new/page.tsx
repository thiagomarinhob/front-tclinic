'use client';

import { useAuthContext } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { getProfessionalByUserIdAction } from '@/actions/professional-actions';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MedicalRecordTemplateEditorPage } from '@/components/settings/MedicalRecordTemplateEditorPage';

export default function NewMedicalRecordTemplatePage() {
  const { user } = useAuthContext();
  const router = useRouter();
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const tenantId = user?.clinicId ?? null;
  const isProfessional = user?.role === UserRole.PROFISSIONAL_SAUDE;

  useEffect(() => {
    if (!tenantId) {
      router.replace('/settings');
      return;
    }
    if (isProfessional && user?.id) {
      getProfessionalByUserIdAction(user.id).then((res) => {
        if (res.success && res.data) setProfessionalId(res.data.id);
      });
    }
  }, [tenantId, isProfessional, user?.id, router]);

  if (!tenantId) return null;

  return (
    <MedicalRecordTemplateEditorPage
      templateId={null}
      tenantId={tenantId}
      professionalId={professionalId}
      isProfessional={isProfessional}
    />
  );
}
