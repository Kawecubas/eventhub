import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listEvents, saveEvent } from "@/lib/event-platform-store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return NextResponse.json(await listEvents());
}

export async function POST(request: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const body = await request.json();
  if (!body.name || !body.slug) {
    return NextResponse.json(
      { error: "Nome e slug são obrigatórios" },
      { status: 400 }
    );
  }
  return NextResponse.json(await saveEvent(body));
}
