import { NextResponse } from "next/server";
import { getEvent, respond } from "@/lib/event-platform-store";
import { sendCheckinEmail } from "@/lib/email-checkin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const guest = await respond(id, body.token, body);

    if (!guest) {
      return NextResponse.json({ error: "Convite inválido" }, { status: 404 });
    }

    if (guest.status === "confirmed") {
      const event = await getEvent(id);
      if (event) {
        try {
          await sendCheckinEmail(event, guest);
        } catch (emailError) {
          console.error("[RESPOSTA] Falha ao enviar confirmação:", emailError);
        }
      }
    }

    return NextResponse.json(guest);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível registrar a resposta.",
      },
      { status: 400 }
    );
  }
}
