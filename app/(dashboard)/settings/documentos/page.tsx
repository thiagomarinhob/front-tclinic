import { Metadata } from 'next';
import { SettingsDocuments } from '@/components/settings/SettingsDocuments';

export const metadata: Metadata = {
  title: 'Configurações — Documentos',
};

export default function SettingsDocumentosPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Documentos</h1>
        <p className="text-muted-foreground">Configure os documentos médicos gerados pela clínica</p>
      </div>

      <SettingsDocuments />
    </div>
  );
}
