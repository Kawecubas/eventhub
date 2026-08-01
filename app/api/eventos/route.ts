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
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Não autorizado." },
      { status: 401 }
    );
  }

  const { id } = await params;
  const deleted = await removeEvent(id);

  if (!deleted) {
    return NextResponse.json(
      { error: "Evento não encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Evento excluído com sucesso.",
  });
}