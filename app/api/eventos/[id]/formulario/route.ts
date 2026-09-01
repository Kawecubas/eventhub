import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin-auth";
import {
  getEvent,
  saveEvent,
  type EventFormField,
} from "@/lib/event-platform-store";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function saveForm(
  request: Request,
  { params }: RouteContext
) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Não autorizado." },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const event = await getEvent(id);

    if (!event) {
      return NextResponse.json(
        { error: "Evento não encontrado." },
        { status: 404 }
      );
    }

    const body = await request.json();

    if (!Array.isArray(body.formFields)) {
      return NextResponse.json(
        { error: "Os campos do formulário são inválidos." },
        { status: 400 }
      );
    }

    const formFields = body.formFields as EventFormField[];

    const savedEvent = await saveEvent({
      ...event,
      formFields,
    });

    return NextResponse.json({
      ok: true,
      formFields: savedEvent.formFields,
    });
  } catch (error) {
    console.error("[SAVE EVENT FORM]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar o formulário.",
      },
      { status: 500 }
    );
    }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  return saveForm(request, context);
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  return saveForm(request, context);
}
