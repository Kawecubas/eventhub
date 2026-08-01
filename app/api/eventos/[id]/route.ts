// app/api/eventos/[id]/route.ts

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

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Não autorizado." },
      { status: 401 }
    );
  }

  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    return NextResponse.json(
      { error: "Evento não encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json(event);
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const { id } = await params;

    console.log("[DELETE EVENT] ID recebido:", id);

    const event = await getEvent(id);

    if (!event) {
      console.log("[DELETE EVENT] Evento não encontrado:", id);

      return NextResponse.json(
        { error: "Evento não encontrado." },
        { status: 404 }
      );
    }

    const deleted = await removeEvent(event.id);

    console.log("[DELETE EVENT] Resultado:", deleted);

    if (!deleted) {
      return NextResponse.json(
        { error: "O evento não foi removido do banco." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Evento excluído com sucesso.",
    });
  } catch (error) {
    console.error("[DELETE EVENT] Erro:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao excluir o evento.",
      },
      { status: 500 }
    );
  }
}