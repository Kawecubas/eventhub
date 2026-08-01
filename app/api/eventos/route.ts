import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin-auth";
import {
  listEvents,
  saveEvent,
} from "@/lib/event-platform-store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Não autorizado." },
      { status: 401 }
    );
  }

  try {
    return NextResponse.json(await listEvents());
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao listar eventos.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Não autorizado." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const slug = String(body.slug ?? "").trim();

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Nome e slug são obrigatórios." },
        { status: 400 }
      );
    }

    const event = await saveEvent({
      ...body,
      name,
      slug,
    });

    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao salvar evento.",
      },
      { status: 500 }
    );
  }
}