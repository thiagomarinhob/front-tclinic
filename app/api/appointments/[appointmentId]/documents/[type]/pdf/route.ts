import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.tclinic.com.br/v1";

export async function POST(
  request: Request,
  context: { params: Promise<{ appointmentId: string; type: string }> },
) {
  const { appointmentId, type } = await context.params;
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const bodyText = await request.text();

  const backendUrl = `${API_BASE_URL}/appointments/${appointmentId}/documents/${type}/pdf`;
  const res = await fetch(backendUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: bodyText || undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    let message = "Erro ao gerar PDF";
    try {
      message = JSON.parse(text).message || message;
    } catch {
      /* use default */
    }
    return NextResponse.json({ message }, { status: res.status });
  }

  const blob = await res.blob();
  const disposition =
    res.headers.get("Content-Disposition") ||
    `attachment; filename="${type}-${appointmentId}.pdf"`;

  return new NextResponse(blob, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
    },
  });
}
