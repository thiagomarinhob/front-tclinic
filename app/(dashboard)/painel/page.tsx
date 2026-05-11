'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getChamadasHojeAction, type ChamadaPainelItem } from '@/actions/painel-actions';
import { MonitorPlay, Volume2, VolumeX, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function speak(nomePaciente: string, setor: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const msg = new SpeechSynthesisUtterance(
    `Atenção! ${nomePaciente}, por favor dirija-se ao ${setor}.`
  );
  msg.lang = 'pt-BR';
  msg.rate = 0.88;
  msg.pitch = 1.05;
  msg.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  const ptBR = voices.find((v) => v.lang === 'pt-BR') ?? voices.find((v) => v.lang.startsWith('pt'));
  if (ptBR) msg.voice = ptBR;

  window.speechSynthesis.speak(msg);
}

function formatHora(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function PainelPage() {
  const [chamadas, setChamadas] = useState<ChamadaPainelItem[]>([]);
  const [currentCall, setCurrentCall] = useState<ChamadaPainelItem | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const lastCallIdRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchChamadas = useCallback(async () => {
    const result = await getChamadasHojeAction();
    if (!result.success || !result.data) return;

    const lista = result.data;
    setChamadas(lista);

    if (lista.length === 0) return;

    const latest = lista[0];
    if (latest.id !== lastCallIdRef.current) {
      lastCallIdRef.current = latest.id;
      setCurrentCall(latest);
      setIsNew(true);
      setTimeout(() => setIsNew(false), 3000);

      if (soundEnabled) {
        speak(latest.nomePaciente, latest.setor);
      }
    }
  }, [soundEnabled]);

  useEffect(() => {
    fetchChamadas();
    intervalRef.current = setInterval(fetchChamadas, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchChamadas]);

  const handleEnableSound = () => {
    setSoundEnabled(true);
    if (currentCall) {
      speak(currentCall.nomePaciente, currentCall.setor);
    } else {
      const test = new SpeechSynthesisUtterance('Som ativado.');
      test.lang = 'pt-BR';
      window.speechSynthesis.speak(test);
    }
  };

  const recentes = chamadas.slice(1, 6);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          <MonitorPlay className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold">Painel de Chamadas</h1>
            <p className="text-xs text-muted-foreground">
              Atualização automática a cada 3 segundos
            </p>
          </div>
        </div>

        <Button
          variant={soundEnabled ? 'default' : 'outline'}
          size="sm"
          onClick={soundEnabled ? () => setSoundEnabled(false) : handleEnableSound}
          className="gap-2"
        >
          {soundEnabled ? (
            <><Volume2 className="h-4 w-4" />Som ativado</>
          ) : (
            <><VolumeX className="h-4 w-4" />Ativar som</>
          )}
        </Button>
      </div>

      {/* Corpo */}
      <div className="flex flex-1 gap-0">
        {/* Chamada atual */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[400px]">
          {!currentCall ? (
            <div className="text-center space-y-4 text-muted-foreground">
              <MonitorPlay className="h-20 w-20 mx-auto opacity-20" />
              <p className="text-xl font-medium">Aguardando chamadas...</p>
              <p className="text-sm">
                Quando um médico chamar um paciente, o nome aparecerá aqui.
              </p>
            </div>
          ) : (
            <div className={cn('text-center space-y-6 transition-all duration-500', isNew && 'scale-105')}>
              <div className="flex items-center justify-center gap-2">
                <span className={cn('inline-block h-3 w-3 rounded-full bg-green-500', isNew && 'animate-ping')} />
                <span className="text-sm font-semibold uppercase tracking-widest text-green-600">
                  {currentCall.numeroChamada > 1 ? `${currentCall.numeroChamada}ª chamada` : 'Chamando'}
                </span>
              </div>

              <div className={cn(
                'rounded-2xl border-2 px-10 py-8 shadow-sm transition-all duration-500',
                isNew ? 'border-green-400 bg-green-50 shadow-green-100' : 'border-border bg-card'
              )}>
                <p className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                  {currentCall.nomePaciente}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Consultório</p>
                <p className="text-2xl md:text-3xl font-semibold text-primary">{currentCall.setor}</p>
              </div>

              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatHora(currentCall.horaChamada)}
              </p>

              {soundEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => speak(currentCall.nomePaciente, currentCall.setor)}
                >
                  <Volume2 className="h-4 w-4" />
                  Repetir chamada
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Chamadas anteriores */}
        {recentes.length > 0 && (
          <div className="w-72 border-l bg-muted/30 flex flex-col">
            <div className="px-4 py-3 border-b">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Chamadas anteriores
              </p>
            </div>
            <div className="flex-1 overflow-y-auto divide-y">
              {recentes.map((chamada, i) => (
                <div key={chamada.id} className={cn('px-4 py-3', i === 0 ? 'opacity-70' : 'opacity-40')}>
                  <p className="font-medium text-sm truncate">{chamada.nomePaciente}</p>
                  <p className="text-xs text-muted-foreground">{chamada.setor}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {formatHora(chamada.horaChamada)}
                    {chamada.numeroChamada > 1 && (
                      <span className="ml-1 text-amber-600">({chamada.numeroChamada}ª chamada)</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dica de som */}
      {!soundEnabled && (
        <div className="border-t bg-amber-50 border-amber-200 px-6 py-2 text-center">
          <p className="text-xs text-amber-700">
            <strong>Dica:</strong> Clique em <strong>Ativar som</strong> para que a voz chame
            o paciente automaticamente. Esta página deve ficar aberta no computador da recepção
            ou em uma TV.
          </p>
        </div>
      )}
    </div>
  );
}
