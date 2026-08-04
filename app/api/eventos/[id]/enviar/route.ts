import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin-auth";
import { getCompanySettings } from "@/lib/company-settings";
import { sendEmail } from "@/lib/email-service";
import { getEvent, markSent } from "@/lib/event-platform-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function replaceVariables(
  template: string,
  values: Record<"nome" | "empresa" | "evento" | "link", string>
) {
  return template
    .replaceAll("{{nome}}", values.nome)
    .replaceAll("{{empresa}}", values.empresa)
    .replaceAll("{{evento}}", values.evento)
    .replaceAll("{{link}}", values.link);
}

export async function POST(request: Request, { params }: RouteContext) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const { guestIds = [] } = (await request.json()) as { guestIds?: string[] };
  const event = await getEvent(id);

  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
  }

  const settings = await getCompanySettings();
  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const selectedGuests = event.guests.filter((guest) =>
    guestIds.includes(guest.id)
  );

  let sent = 0;
  const failed: Array<{ guestId: string; email: string; error: string }> = [];
  const successfullySent: string[] = [];

  for (const guest of selectedGuests) {
    try {
      const link = `${base}/eventos/${event.slug}?token=${guest.token}`;
      const values = {
        nome: guest.name,
        empresa: guest.company || "",
        evento: event.name,
        link,
      };
      const subject = replaceVariables(event.emailSubject, values);
      const template = event.emailHtml?.trim() || event.emailBody;
      const html = event.emailHtml?.trim()
        ? replaceVariables(template, values)
        : `<div style="font-family:Arial,sans-serif;line-height:1.6"><p>${replaceVariables(
            template,
            values
          ).replaceAll("\n", "<br>")}</p><p><a href="${link}" style="display:inline-block;background:${event.primaryColor};color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Confirmar participação</a></p></div>`;

      await sendEmail(settings, {
        to: guest.email,
        subject,
        html,
        text: replaceVariables(event.emailBody, values),
      });

      successfullySent.push(guest.id);
      sent += 1;
    } catch (error) {
      failed.push({
        guestId: guest.id,
        email: guest.email,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await markSent(event.id, successfullySent);

  return NextResponse.json({
    sent,
    failed: failed.length,
    failures: failed,
    message: `${sent} convite(s) enviado(s) e ${failed.length} falha(s).`,
  });
}
