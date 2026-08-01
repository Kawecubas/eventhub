import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin-auth";
import {
  getEvent,
  removeEvent,
} from "@/lib/event-platform-store";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    console.log("==== EXCLUIR EVENTO ====");

    if (!(await isAdmin())) {
      console.log("Não autorizado");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    console.log("ID recebido:", id);

    const event = await getEvent(id);

    console.log("Evento encontrado:", event);

    if (!event) {
      return NextResponse.json(
        { error: "Evento não encontrado" },
        { status: 404 }
      );
    }

    const deleted = await removeEvent(event.id);

    console.log("Resultado removeEvent:", deleted);

    return NextResponse.json({
      ok: deleted,
    });
  } catch (err) {
    console.error("ERRO DELETE EVENTO");
    console.error(err);

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
        stack:
          process.env.NODE_ENV === "development"
            ? err instanceof Error
              ? err.stack
              : null
            : undefined,
      },
      { status: 500 }
    );
  }
}