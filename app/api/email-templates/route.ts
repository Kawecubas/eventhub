import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin-auth";
import {
  listSystemEmailTemplates,
  saveSystemEmailTemplate,
} from "@/lib/email-template-store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Não autorizado." },
      { status: 401 }
    );
  }

  return NextResponse.json(await listSystemEmailTemplates());
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
    const template = await saveSystemEmailTemplate(body);
    return NextResponse.json(template);
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
