import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin-auth";
import {
  deleteSystemEmailTemplate,
  getSystemEmailTemplate,
  saveSystemEmailTemplate,
} from "@/lib/email-template-store";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
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
  const template = await getSystemEmailTemplate(id);

  if (!template) {
    return NextResponse.json(
      { error: "Template não encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json(template);
}

export async function PUT(
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
    const body = await request.json();

    return NextResponse.json(
      await saveSystemEmailTemplate({
        ...body,
        id,
      })
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar o template.",
      },
      { status: 400 }
    );
  }
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
  const deleted = await deleteSystemEmailTemplate(id);

  return NextResponse.json({ ok: deleted });
}
