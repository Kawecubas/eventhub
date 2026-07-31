import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getEvent, markSent } from "@/lib/event-platform-store";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAdmin()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { guestIds = [] } = (await request.json()) as { guestIds?: string[] };
  const event = await getEvent(params.id);
  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const key = process.env.RESEND_API_KEY;
  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  if (!key) {
    return NextResponse.json(
      { error: "Configure RESEND_API_KEY para enviar e-mails." },
      { status: 400 }
    );
  }

  let sent = 0;
  const successfullySent: string[] = [];
  for (const guest of event.guests.filter((item) => guestIds.includes(item.id))) {
    const link = `${base}/eventos/${event.slug}?token=${guest.token}`;
    const subject = event.emailSubject
      .replaceAll("{{evento}}", event.name)
      .replaceAll("{{nome}}", guest.name)
      .replaceAll("{{link}}", link);
    const text = event.emailBody
      .replaceAll("{{evento}}", event.name)
      .replaceAll("{{nome}}", guest.name)
      .replaceAll("{{link}}", link);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: event.emailFrom,
        to: [guest.email],
        subject,
        html: `<div style="font-family:Arial;line-height:1.6"><p>${text.replaceAll(
          "\n",
          "<br>"
        )}</p><p><a href="${link}" style="background:${event.primaryColor};color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Confirmar participação</a></p></div>`,
      }),
    });

    if (response.ok) {
      sent += 1;
      successfullySent.push(guest.id);
    }
  }

  await markSent(event.id, successfullySent);
  return NextResponse.json({ message: `${sent} convite(s) enviado(s).` });
}
