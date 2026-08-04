import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin-auth";
import { addGuest, deleteGuest } from "@/lib/event-platform-store";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const guest = await addGuest(id, body);

    return guest
      ? NextResponse.json(guest)
      : NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao cadastrar" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const guestId = new URL(request.url).searchParams.get("guestId") || "";

  if (!guestId) {
    return NextResponse.json(
      { error: "Convidado não informado." },
      { status: 400 }
    );
  }

  const ok = await deleteGuest(id, guestId);

  return NextResponse.json(
    ok ? { ok: true } : { error: "Convidado não encontrado." },
    { status: ok ? 200 : 404 }
  );
}
