import { NextResponse } from "next/server";

import { markSent, registerPublicGuest } from "@/lib/event-platform-store";
import { sendCheckinEmail } from "@/lib/email-checkin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();

    const result = await registerPublicGuest(id, body);

    if (!result) {
      return NextResponse.json(
        { error: "Evento não encontrado." },
        { status: 404 }
      );
    }

    try {
      await sendCheckinEmail(result.event, result.guest);
      await markSent(result.event.id, [result.guest.id]);
    } catch (emailError) {
      // Não falha a inscrição se o e-mail falhar — apenas loga.
      console.error("[INSCRICAO PUBLICA] Falha ao enviar e-mail:", emailError);
    }

    return NextResponse.json({
      ok: true,
      guest: {
        id: result.guest.id,
        name: result.guest.name,
        status: result.guest.status,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao processar inscrição.",
      },
      { status: 400 }
    );
  }
}
