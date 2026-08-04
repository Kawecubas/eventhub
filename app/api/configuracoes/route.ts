import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin-auth";
import {
  getCompanySettings,
  publicCompanySettings,
  saveCompanySettings,
  type CompanySettings,
} from "@/lib/company-settings";
import { encryptSecret } from "@/lib/secret-crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SettingsPayload = Partial<CompanySettings> & {
  smtpPassword?: string;
  clearSmtpPassword?: boolean;
};

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  return NextResponse.json(
    publicCompanySettings(await getCompanySettings())
  );
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as SettingsPayload;
    const current = await getCompanySettings();

    let smtpPasswordEncrypted = current.smtpPasswordEncrypted;

    if (body.clearSmtpPassword) {
      smtpPasswordEncrypted = "";
    } else if (typeof body.smtpPassword === "string" && body.smtpPassword.trim()) {
      smtpPasswordEncrypted = encryptSecret(body.smtpPassword);
    }

    const { smtpPassword: _password, clearSmtpPassword: _clear, ...safeBody } =
      body;

    const saved = await saveCompanySettings({
      ...safeBody,
      smtpPasswordEncrypted,
    });

    return NextResponse.json(publicCompanySettings(saved));
  } catch (error) {
    console.error("[SAVE SETTINGS]", error);
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
