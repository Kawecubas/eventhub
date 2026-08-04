import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin-auth";
import { getCompanySettings } from "@/lib/company-settings";
import { sendEmail } from "@/lib/email-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { email?: string };
    const recipient = String(body.email ?? "").trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      return NextResponse.json(
        { error: "Informe um e-mail de teste válido." },
        { status: 400 }
      );
    }

    const settings = await getCompanySettings();

    await sendEmail(settings, {
      to: recipient,
      subject: "Teste de envio — EventHub",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:32px">
          <h2 style="color:${settings.primaryColor}">Configuração concluída</h2>
          <p>O envio de e-mails do EventHub está funcionando.</p>
          <p><strong>Provedor:</strong> ${settings.emailProvider}</p>
        </div>
      `,
      text: `Configuração concluída. Provedor: ${settings.emailProvider}.`,
    });

    return NextResponse.json({ ok: true, message: "E-mail de teste enviado." });
  } catch (error) {
    console.error("[EMAIL TEST]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível enviar o e-mail de teste.",
      },
      { status: 500 }
    );
  }
}
