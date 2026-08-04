import { NextResponse } from "next/server";
import { respond } from "@/lib/event-platform-store";

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

    return guest
      ? NextResponse.json(guest)
      : NextResponse.json({ error: "Convite inválido" }, { status: 404 });
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
