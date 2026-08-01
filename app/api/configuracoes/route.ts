import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import {
  getCompanySettings,
  saveCompanySettings,
} from "@/lib/company-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  return NextResponse.json(await getCompanySettings());
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const input = await request.json();
    return NextResponse.json(await saveCompanySettings(input));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar as configurações.",
      },
      { status: 500 }
    );
  }
}
