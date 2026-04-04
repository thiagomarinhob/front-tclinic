import { Metadata } from 'next';
import { SettingsMedicalRecordTemplates } from '@/components/settings/SettingsMedicalRecordTemplates';

export const metadata: Metadata = {
  title: 'Configurações — Prontuários',
};

export default function SettingsProntuariosPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prontuários</h1>
        <p className="text-muted-foreground">Gerencie os modelos de prontuário da clínica</p>
      </div>

      <SettingsMedicalRecordTemplates />
    </div>
  );
}
