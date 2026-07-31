import { NextResponse } from "next/server";
import { respond } from "@/lib/event-platform-store";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const guest = await respond(params.id, body.token, body);
  return guest
    ? NextResponse.json(guest)
    : NextResponse.json({ error: "Convite inválido" }, { status: 404 });
}
