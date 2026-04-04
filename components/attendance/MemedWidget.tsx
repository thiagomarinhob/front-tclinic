'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle, FileText, FlaskConical, FileCheck, Send } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { env } from '@/config/env';
import {
  generateMemedTokenAction,
  saveMemedDocumentWithPdfAction,
} from '@/actions/memed-actions';
import type { Patient } from '@/types';

// ── Tipos globais injetados pelo SDK do Memed ──────────────────────────────
declare global {
  interface Window {
    MdSinapsePrescricao?: {
      event: {
        add: (
          event: string,
          callback: (module: { name: string }) => void
        ) => void;
      };
    };
    MdHub?: {
      command: {
        send: (
          module: string,
          command: string,
          data: Record<string, unknown>
        ) => Promise<void>;
      };
      module: {
        show: (module: string) => void;
        hide: (module: string) => void;
      };
      event: {
        add: (event: string, callback: (data: unknown) => void) => void;
      };
    };
  }
}

/** Dados do local de trabalho do prescritor para o cabeçalho do receituário */
export interface WorkplaceData {
  city?: string;
  state?: string;
  cnes?: number;
  local_name?: string;
  address?: string;
  phone?: number;
  cpf?: string;
}

interface MemedWidgetProps {
  appointmentId: string;
  professionalId: string;
  /** Dados do paciente para pré-preencher a prescrição no Memed */
  patient?: Patient;
  /** Dados da clínica/local de trabalho para o cabeçalho do receituário */
  workplace?: WorkplaceData;
  onDocumentSaved?: () => void;
}

export function MemedWidget({
  appointmentId,
  professionalId,
  patient,
  workplace,
  onDocumentSaved,
}: MemedWidgetProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Armazena o token do usuário para buscar o PDF após a prescrição ser gerada
  const userTokenRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let scriptEl: HTMLScriptElement | null = null;
    let removeListener: (() => void) | null = null;

    async function init() {
      // 1. Obtém o token do prescritor via backend
      const result = await generateMemedTokenAction(professionalId, appointmentId);
      if (!mounted) return;

      if (!result.success || !result.data?.token) {
        setErrorMsg(result.error ?? 'Não foi possível obter o token do Memed.');
        setStatus('error');
        return;
      }

      const token = result.data.token;
      userTokenRef.current = token;

      // 2. Injeta o script do Memed com o data-token no body (recomendado pela doc)
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = env.memedScriptUrl;
      script.async = true;
      script.dataset.token = token;
      script.dataset.color = env.memedColor;

      script.onerror = () => {
        if (!mounted) return;
        setErrorMsg('Falha ao carregar o SDK do Memed. Verifique sua conexão.');
        setStatus('error');
      };

      script.onload = () => {
        if (!mounted) return;

        if (!window.MdSinapsePrescricao) {
          setErrorMsg('SDK do Memed não carregou corretamente.');
          setStatus('error');
          return;
        }

        // 3. Aguarda o módulo de prescrição inicializar
        window.MdSinapsePrescricao.event.add(
          'core:moduleInit',
          async (module) => {
            if (!mounted) return;
            if (module.name !== 'plataforma.prescricao') return;

            // 4. Envia os dados do paciente para o Memed
            if (patient && window.MdHub) {
              const patientData: Record<string, unknown> = {
                idExterno: patient.id,
                nome:      patient.fullName,
              };

              if (patient.cpf) {
                patientData.cpf = patient.cpf;
              } else {
                patientData.withoutCpf = true;
              }

              if (patient.phone)          patientData.telefone   = patient.phone;
              if (patient.addressStreet)  patientData.endereco   = patient.addressStreet;
              if (patient.addressCity)    patientData.cidade     = patient.addressCity;

              await window.MdHub.command.send(
                'plataforma.prescricao',
                'setPaciente',
                patientData
              );
            }

            // 5. Pré-preenche dados do local de trabalho (clínica) no receituário
            if (workplace && window.MdHub) {
              const workplacePayload: Record<string, unknown> = {};
              if (workplace.city)       workplacePayload.city       = workplace.city;
              if (workplace.state)      workplacePayload.state      = workplace.state;
              if (workplace.cnes)       workplacePayload.cnes       = workplace.cnes;
              if (workplace.local_name) workplacePayload.local_name = workplace.local_name;
              if (workplace.address)    workplacePayload.address    = workplace.address;
              if (workplace.phone)      workplacePayload.phone      = workplace.phone;
              if (workplace.cpf)        workplacePayload.cpf        = workplace.cpf;

              if (Object.keys(workplacePayload).length > 0) {
                await window.MdHub.command.send(
                  'plataforma.prescricao',
                  'setWorkplace',
                  workplacePayload
                );
              }
            }

            // 6. Bloqueia edição do paciente e desabilita onboarding
            await window.MdHub?.command.send(
              'plataforma.prescricao',
              'setFeatureToggle',
              {
                deletePatient:      false,
                removePatient:      false,
                editPatient:        false,
                editIdentification: false,
                guidesOnboarding:   false,
              }
            );

            // 7. Escuta o evento de prescrição impressa (dados completos para analytics)
            window.MdHub?.event.add('prescricaoImpressa', (prescriptionData) => {
              // prescriptionData contém paciente, prescritor e array de medicamentos/exames
              // com tipo, receituário, códigos SUS/TUSS etc.
              // Pode ser usado futuramente para analytics ou atualização de dados.
              console.log('[Memed] prescricaoImpressa:', prescriptionData);
            });

            if (mounted) setStatus('ready');
          }
        );
      };

      scriptEl = script;
      document.body.appendChild(script);

      // 6. Escuta documentos gerados/assinados no Memed
      // O evento traz: prescricoes[].id (ID da prescrição) e prescricoes[].tipo
      const handleDocumentSaved = async (event: Event) => {
        const customEvent = event as CustomEvent;
        const prescricoes: Array<{ id?: string | number; tipo?: string }> =
          customEvent.detail?.prescricoes ?? [];

        const currentToken = userTokenRef.current;

        for (const prescricao of prescricoes) {
          const prescriptionId = prescricao.id ? String(prescricao.id) : null;
          const tipo = prescricao.tipo ?? 'PRESCRICAO';

          if (prescriptionId && currentToken) {
            // Busca o PDF via backend (que consulta a API do Memed) e salva
            await saveMemedDocumentWithPdfAction(
              appointmentId,
              prescriptionId,
              currentToken,
              tipo
            );
          }
        }

        onDocumentSaved?.();
      };

      window.addEventListener('prescricaoDocumentoSalvo', handleDocumentSaved);
      removeListener = () =>
        window.removeEventListener('prescricaoDocumentoSalvo', handleDocumentSaved);
    }

    init();

    return () => {
      mounted = false;
      removeListener?.();
      if (scriptEl && document.body.contains(scriptEl)) {
        document.body.removeChild(scriptEl);
      }
    };
  }, [appointmentId, professionalId, patient, workplace, onDocumentSaved]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Carregando ferramentas Memed...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {errorMsg ?? 'Erro desconhecido ao inicializar o Memed.'}
        </AlertDescription>
      </Alert>
    );
  }

  function openMemed(item?: { nome: string; posologia: string }) {
    window.MdHub?.module.show('plataforma.prescricao');
    if (item) {
      window.MdHub?.command.send('plataforma.prescricao', 'addItem', item);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Selecione o tipo de documento para abrir o módulo de prescrição digital.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Button
          variant="outline"
          className="flex flex-col h-auto py-4 gap-2"
          onClick={() => openMemed()}
        >
          <FileText className="h-5 w-5 text-primary" />
          <span className="text-xs">Receita</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col h-auto py-4 gap-2"
          onClick={() => openMemed()}
        >
          <FlaskConical className="h-5 w-5 text-primary" />
          <span className="text-xs">Exames</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col h-auto py-4 gap-2"
          onClick={() => openMemed({ nome: 'Atestado Médico', posologia: '' })}
        >
          <FileCheck className="h-5 w-5 text-primary" />
          <span className="text-xs">Atestado</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col h-auto py-4 gap-2"
          onClick={() => openMemed({ nome: 'Encaminhamento', posologia: '' })}
        >
          <Send className="h-5 w-5 text-primary" />
          <span className="text-xs">Encaminhar</span>
        </Button>
      </div>
      {/* O SDK do Memed injeta a interface de prescrição aqui (overlay flutuante) */}
      <div id="memed-container" />
    </div>
  );
}
