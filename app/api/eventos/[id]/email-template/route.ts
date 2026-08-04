import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getEvent, saveEvent } from "@/lib/event-platform-store";
import { buildVisualEmailHtml } from "@/lib/email-template-builder";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const event = await getEvent(id);

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
    }

    const body = await request.json();
    const assetUrl = String(body.assetUrl ?? "").trim();

    if (!assetUrl.startsWith("https://")) {
      return NextResponse.json(
        { error: "Envie e salve uma imagem pública antes de gerar o e-mail." },
        { status: 400 }
      );
    }

    const config = {
      assetUrl,
      altText: String(body.altText ?? event.name).trim(),
      preheader: String(body.preheader ?? `Convite para ${event.name}`).trim(),
      heading: String(body.heading ?? event.name).trim(),
      body: String(body.body ?? event.emailBody ?? "").trim(),
      ctaLabel: String(body.ctaLabel ?? "Confirmar participação").trim(),
      primaryColor: String(body.primaryColor ?? event.primaryColor ?? "#173b57"),
      backgroundColor: String(body.backgroundColor ?? "#f3f6f9"),
      footer: String(body.footer ?? "Gestão de eventos").trim(),
    };

    const emailHtml = buildVisualEmailHtml(config);
    const saved = await saveEvent({
      ...event,
      emailHtml,
      emailSubject: String(body.subject ?? event.emailSubject ?? `Convite: ${event.name}`).trim(),
      emailBody: config.body,
    });

    return NextResponse.json({
      ok: true,
      emailHtml: saved.emailHtml,
      config,
    });
  } catch (error) {
    console.error("[SAVE VISUAL EMAIL TEMPLATE]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao salvar template." },
      { status: 500 }
    );
  }
}
