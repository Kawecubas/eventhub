import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getEvent, markSent } from "@/lib/event-platform-store";

export const dynamic = "force-dynamic";

type SendRequestBody = {
  guestIds?: string[];
  mode?: "selected" | "pending" | "all";
};

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as SendRequestBody;
    const guestIds = Array.isArray(body.guestIds) ? body.guestIds : [];
    const mode = body.mode ?? (guestIds.length ? "selected" : "pending");
    const event = await getEvent(params.id);

    if (!event) {
      return NextResponse.json(
        { error: "Evento não encontrado." },
        { status: 404 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY não configurada." },
        { status: 500 }
      );
    }

    const emailFrom =
      event.emailFrom?.trim() || process.env.EMAIL_FROM?.trim();
    if (!emailFrom) {
      return NextResponse.json(
        { error: "Configure EMAIL_FROM ou o remetente do evento." },
        { status: 400 }
      );
    }

    const baseUrl = (
      process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    ).replace(/\/$/, "");

    const recipients = event.guests.filter((guest) => {
      if (!guest.email) return false;
      if (mode === "all") return true;
      if (mode === "selected") return guestIds.includes(guest.id);
      return guest.status === "pending";
    });

    const successfullySent: string[] = [];
    const failures: Array<{ email: string; error: string }> = [];

    for (const guest of recipients) {
      const link = `${baseUrl}/eventos/${encodeURIComponent(
        event.slug
      )}?token=${encodeURIComponent(guest.token)}`;
      const subject = replaceVariables(
        event.emailSubject || "Convite: {{evento}}",
        event.name,
        guest.name,
        link
      );
      const text = replaceVariables(
        event.emailBody ||
          "Olá, {{nome}}. Você está convidado para {{evento}}. {{link}}",
        event.name,
        guest.name,
        link
      );

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [guest.email],
          reply_to: process.env.EMAIL_REPLY_TO || undefined,
          subject,
          html: buildEmailHtml(
            text,
            link,
            event.primaryColor || "#173b57",
            event.name
          ),
        }),
      });

      const responseBody = await response.json().catch(() => null);

      if (!response.ok) {
        const error =
          responseBody?.message ||
          responseBody?.error ||
          `Erro HTTP ${response.status}`;
        console.error("Erro do Resend", {
          email: guest.email,
          status: response.status,
          responseBody,
        });
        failures.push({ email: guest.email, error: String(error) });
        continue;
      }

      successfullySent.push(guest.id);
    }

    await markSent(event.id, successfullySent);

    return NextResponse.json({
      message: `${successfullySent.length} convite(s) enviado(s) e ${failures.length} falha(s).`,
      sent: successfullySent.length,
      failed: failures.length,
      failures,
    });
  } catch (error) {
    console.error("Erro ao enviar convites", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao enviar convites.",
      },
      { status: 500 }
    );
  }
}

function replaceVariables(
  template: string,
  eventName: string,
  guestName: string,
  link: string
) {
  return template
    .replaceAll("{{evento}}", eventName)
    .replaceAll("{{nome}}", guestName)
    .replaceAll("{{link}}", link);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildEmailHtml(
  text: string,
  link: string,
  primaryColor: string,
  eventName: string
) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f5f7fa;padding:24px"><div style="max-width:620px;margin:auto;background:#fff;border-radius:12px;padding:32px;font-family:Arial,sans-serif;color:#17212b"><h1>${escapeHtml(
    eventName
  )}</h1><div style="line-height:1.6">${escapeHtml(text).replaceAll(
    "\n",
    "<br>"
  )}</div><p style="margin:32px 0"><a href="${escapeHtml(
    link
  )}" style="display:inline-block;background:${escapeHtml(
    primaryColor
  )};color:#fff;padding:14px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Confirmar participação</a></p><p style="font-size:12px;color:#667085">Este link é individual e está associado ao seu cadastro.</p></div></body></html>`;
}
