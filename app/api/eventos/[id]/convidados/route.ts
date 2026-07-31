import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { addGuest, deleteGuest } from "@/lib/event-platform-store";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAdmin()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const guest = await addGuest(params.id, body);
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
  { params }: { params: { id: string } }
) {
  if (!isAdmin()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const guestId = new URL(request.url).searchParams.get("guestId") || "";
  return NextResponse.json({ ok: await deleteGuest(params.id, guestId) });
}
