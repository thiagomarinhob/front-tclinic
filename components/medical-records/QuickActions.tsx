'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  FlaskConical,
  FileCheck,
  Paperclip,
  Send,
  Printer,
} from 'lucide-react';

// Especialidades que não podem prescrever medicamentos (receita → indicação)
const ESPECIALIDADES_SEM_RECEITA = ['FISIOTERAPEUTA', 'PSICOLOGISTA'];
// Especialidades que não podem emitir atestado médico
const ESPECIALIDADES_SEM_ATESTADO = ['ENFERMEIRO'];

interface QuickActionsProps {
  appointmentId: string;
  professionalSpecialty?: string | null;
  onReceitaClick?: () => void;
  onExamesClick?: () => void;
  onAtestadoClick?: () => void;
  onEncaminhamentoClick?: () => void;
  onAttachmentsClick?: () => void;
  onPrintClick?: () => void;
}

export function QuickActions({
  appointmentId: _appointmentId,
  professionalSpecialty,
  onReceitaClick,
  onExamesClick,
  onAtestadoClick,
  onEncaminhamentoClick,
  onAttachmentsClick,
  onPrintClick,
}: QuickActionsProps) {
  const specialty = professionalSpecialty ?? '';
  const semReceita = ESPECIALIDADES_SEM_RECEITA.includes(specialty);
  const semAtestado = ESPECIALIDADES_SEM_ATESTADO.includes(specialty);

  const actions = [
    {
      icon: FileText,
      label: semReceita ? 'Indicação' : 'Receita',
      onClick: () => onReceitaClick?.(),
      title: semReceita ? 'Gerar indicação em PDF' : 'Gerar receituário em PDF',
      hidden: false,
    },
    {
      icon: FlaskConical,
      label: 'Exames',
      onClick: () => onExamesClick?.(),
      title: 'Gerar solicitação de exames em PDF',
      hidden: false,
    },
    {
      icon: FileCheck,
      label: 'Atestado',
      onClick: () => onAtestadoClick?.(),
      title: 'Emitir atestado médico em PDF',
      hidden: semAtestado,
    },
    {
      icon: Send,
      label: 'Encaminhar',
      onClick: () => onEncaminhamentoClick?.(),
      title: 'Gerar encaminhamento em PDF',
      hidden: false,
    },
    {
      icon: Paperclip,
      label: 'Anexos',
      onClick: () => onAttachmentsClick?.(),
      title: 'Gerenciar anexos do atendimento',
      hidden: false,
    },
    {
      icon: Printer,
      label: 'Imprimir',
      onClick: () => onPrintClick?.(),
      title: 'Imprimir / exportar documentos',
      hidden: false,
    },
  ].filter((a) => !a.hidden);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-muted-foreground font-medium uppercase tracking-wide">
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant="outline"
                className="flex flex-col h-auto py-4 gap-2"
                onClick={action.onClick}
                title={action.title}
              >
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-xs">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
