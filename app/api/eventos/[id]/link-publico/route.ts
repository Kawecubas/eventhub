import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin-auth";
import { getEvent, saveEvent } from "@/lib/event-platform-store";
import { publicEventUrl } from "@/lib/public-event-url";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { id } = await params;
    const event = await getEvent(id);

    if (!event) {
      return NextResponse.json(
        { error: "Evento não encontrado." },
        { status: 404 }
      );
    }

    const updated = await saveEvent({
      ...event,
      publicRegistrationEnabled: true,
    });

    const link = publicEventUrl(`/eventos/${updated.slug}/inscrever`);

    return NextResponse.json({ ok: true, link });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao gerar link público.",
      },
      { status: 500 }
    );
  }
}
