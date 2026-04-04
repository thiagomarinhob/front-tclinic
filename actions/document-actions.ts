'use client';

/**
 * Gera e faz download de um PDF de documento médico.
 * Chama a rota Next.js /api/appointments/[appointmentId]/documents/[type]/pdf.
 */
async function downloadDocumentPdf(
  appointmentId: string,
  type: string,
  body?: unknown,
  filename?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(
      `/api/appointments/${appointmentId}/documents/${type}/pdf`,
      {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || 'Erro ao gerar PDF' };
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${type}-${appointmentId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    return { success: true };
  } catch {
    return { success: false, error: 'Erro inesperado ao gerar PDF' };
  }
}

export async function downloadReceitaPdf(appointmentId: string, prescricoes: string) {
  return downloadDocumentPdf(appointmentId, 'receita', { prescricoes }, `receita-${appointmentId}.pdf`);
}

export async function downloadExamesPdf(
  appointmentId: string,
  exames: string[],
  indicacaoClinica?: string
) {
  return downloadDocumentPdf(
    appointmentId,
    'exames',
    { exames, indicacaoClinica: indicacaoClinica || null },
    `solicitacao-exames-${appointmentId}.pdf`
  );
}

export async function downloadAtestadoPdf(
  appointmentId: string,
  dias: number,
  motivo?: string
) {
  return downloadDocumentPdf(
    appointmentId,
    'atestado',
    { dias, motivo: motivo || null },
    `atestado-${appointmentId}.pdf`
  );
}

export async function downloadEncaminhamentoPdf(appointmentId: string, encaminhamento: string) {
  return downloadDocumentPdf(
    appointmentId,
    'encaminhamento',
    { encaminhamento },
    `encaminhamento-${appointmentId}.pdf`
  );
}
