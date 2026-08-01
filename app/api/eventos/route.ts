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

    const event = await getEvent(id);

    if (!event) {
      return NextResponse.json(
        { error: "Evento não encontrado." },
        { status: 404 }
      );
    }

    const deleted = await removeEvent(event.id);

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
    console.error("Erro ao excluir evento:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao excluir evento.",
      },
      { status: 500 }
    );
  }
}