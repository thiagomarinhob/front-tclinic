'use server';

import { apiRequest } from './_helpers';
import type { ActionResult } from '@/types';

export interface ChamadaPainelItem {
  id: string;
  agendamentoId: string;
  nomePaciente: string;
  setor: string;
  numeroChamada: number;
  horaChamada: string;
}

export async function chamarPacienteAction(
  appointmentId: string,
  roomId: string
): Promise<ActionResult<ChamadaPainelItem>> {
  try {
    const raw = await apiRequest<Record<string, unknown>>('/painel/chamar', {
      method: 'POST',
      params: { appointmentId, roomId },
    });
    return { success: true, data: mapChamada(raw) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao chamar paciente',
    };
  }
}

export async function getChamadasHojeAction(): Promise<ActionResult<ChamadaPainelItem[]>> {
  try {
    const raw = await apiRequest<unknown[]>('/painel/hoje', { method: 'GET' });
    const list = Array.isArray(raw) ? raw : [];
    return { success: true, data: list.map((c) => mapChamada(c as Record<string, unknown>)) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar chamadas',
    };
  }
}

function mapChamada(c: Record<string, unknown>): ChamadaPainelItem {
  return {
    id: String(c.id ?? ''),
    agendamentoId: String(c.appointmentId ?? ''),
    nomePaciente: String(c.patientName ?? '—'),
    setor: String(c.roomName ?? '—'),
    numeroChamada: Number(c.numeroChamada ?? 1),
    horaChamada: String(c.horaChamada ?? ''),
  };
}
