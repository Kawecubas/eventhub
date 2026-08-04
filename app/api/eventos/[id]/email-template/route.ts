import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin-auth";
import {
  getEvent,
  saveEvent,
} from "@/lib/event-platform-store";
import { buildVisualEmailHtml } from "@/lib/email-template-builder";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function booleanValue(
  value: unknown,
  fallback = true
): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export async function POST(
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
    const assetUrl = text(body.assetUrl);

    if (
      !assetUrl.startsWith("https://") &&
      !assetUrl.startsWith("http://")
    ) {
      return NextResponse.json(
        {
          error:
            "Envie e salve uma imagem pública antes de gerar o e-mail.",
        },
        { status: 400 }
      );
    }

    const config = {
      assetUrl,
      altText: text(body.altText) || event.name,
      preheader:
        text(body.preheader) ||
        `Convite para ${event.name}`,
      heading: text(body.heading) || event.name,
      body: text(body.body) || event.emailBody || "",
      ctaLabel:
        text(body.ctaLabel) ||
        "Confirmar participação",
      primaryColor:
        text(body.primaryColor) ||
        event.primaryColor ||
        "#173b57",
      backgroundColor:
        text(body.backgroundColor) || "#f3f6f9",
      showGreeting: booleanValue(body.showGreeting),

      footerLogo: text(body.footerLogo),
      footerTitle: text(body.footerTitle),
      footerText: text(body.footerText),
      footerAddress: text(body.footerAddress),
      footerPhone: text(body.footerPhone),
      footerEmail: text(body.footerEmail),
      footerWebsite: text(body.footerWebsite),
      footerInstagram: text(body.footerInstagram),
      footerLinkedin: text(body.footerLinkedin),
      footerFacebook: text(body.footerFacebook),
      footerBackground:
        text(body.footerBackground) || "#0f2940",
      footerColor: text(body.footerColor) || "#ffffff",
      showFooterLogo: booleanValue(body.showFooterLogo),
      showFooterContact: booleanValue(
        body.showFooterContact
      ),
    };

    const emailHtml = buildVisualEmailHtml(config);

    const saved = await saveEvent({
      ...event,
      emailHtml,
      emailSubject:
        text(body.subject) ||
        event.emailSubject ||
        `Convite: ${event.name}`,
      emailBody: config.body,
    });

    return NextResponse.json({
      ok: true,
      emailHtml: saved.emailHtml,
      config,
    });
  } catch (error) {
    console.error(
      "[SAVE VISUAL EMAIL TEMPLATE]",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao salvar template.",
      },
      { status: 500 }
    );
  }
}
