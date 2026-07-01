import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/constants';
import { ReminderSettingsForm } from '@/components/settings/ReminderSettingsForm';

export const metadata: Metadata = {
  title: 'Lembretes - TClinic',
};

export default function LembretesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={ROUTES.SETTINGS}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Configurações
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lembretes</h2>
          <p className="text-muted-foreground">
            Configure o envio de lembretes de confirmação de agendamento
          </p>
        </div>
      </div>

      <ReminderSettingsForm />
    </div>
  );
}
