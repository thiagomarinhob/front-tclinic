import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.tclinic.com.br/v1";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const res = await fetch(`${API_BASE_URL}/medical-records/${id}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const status = res.status;
    const text = await res.text();
    let message = "Erro ao gerar PDF";
    try {
      const json = JSON.parse(text);
      message = json.message || message;
    } catch {
      // use default
    }
    return NextResponse.json({ message }, { status });
  }

  const blob = await res.blob();
  const disposition =
    res.headers.get("Content-Disposition") ||
    `attachment; filename="prontuario-${id}.pdf"`;

  return new NextResponse(blob, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
    },
  });
}
