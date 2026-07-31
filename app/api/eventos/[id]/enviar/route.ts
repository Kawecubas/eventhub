import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin-auth";
import { getEvent, markSent } from "@/lib/event-platform-store";

type SendRequestBody = {
  guestIds?: string[];
  mode?: "selected" | "pending" | "all";
};

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Não autorizado." },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as SendRequestBody;

    const guestIds = Array.isArray(body.guestIds)
      ? body.guestIds
      : [];

    const mode = body.mode ?? (
      guestIds.length > 0 ? "selected" : "pending"
    );

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

    const baseUrl = (
      process.env.NEXT_PUBLIC_APP_URL ||
      new URL(request.url).origin
    ).replace(/\/$/, "");

    const emailFrom =
      event.emailFrom?.trim() ||
      process.env.EMAIL_FROM?.trim();

    if (!emailFrom) {
      return NextResponse.json(
        {
          error:
            "Configure o remetente no evento ou na variável EMAIL_FROM.",
        },
        { status: 400 }
      );
    }

    const recipients = event.guests.filter((guest) => {
      if (!guest.email?.trim()) {
        return false;
      }

      if (mode === "all") {
        return true;
      }

      if (mode === "selected") {
        return guestIds.includes(guest.id);
      }

      // Quando nenhum ID for enviado, o botão "Enviar para pendentes"
      // seleciona automaticamente os convidados pendentes.
      return guest.status === "pending";
    });

    if (recipients.length === 0) {
      return NextResponse.json(
        {
          message: "Nenhum convidado elegível para envio.",
          sent: 0,
          failed: 0,
          selected: 0,
        },
        { status: 200 }
      );
    }

    const successfullySent: string[] = [];
    const failures: Array<{
      guestId: string;
      email: string;
      error: string;
    }> = [];

    for (const guest of recipients) {
      const link =
        `${baseUrl}/eventos/${encodeURIComponent(event.slug)}` +
        `?token=${encodeURIComponent(guest.token)}`;

      const subjectTemplate =
        event.emailSubject || "Convite: {{evento}}";

      const bodyTemplate =
        event.emailBody ||
        `Olá, {{nome}}.

Você está convidado para o evento {{evento}}.

Confirme sua participação pelo link:
{{link}}`;

      const subject = replaceVariables(subjectTemplate, {
        evento: event.name,
        nome: guest.name,
        link,
      });

      const text = replaceVariables(bodyTemplate, {
        evento: event.name,
        nome: guest.name,
        link,
      });

      try {
        const response = await fetch(
          "https://api.resend.com/emails",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: emailFrom,
              to: [guest.email.trim()],
              reply_to:
                process.env.EMAIL_REPLY_TO?.trim() || undefined,
              subject,
              html: buildEmailHtml({
                text,
                link,
                primaryColor:
                  event.primaryColor || "#173B57",
                eventName: event.name,
              }),
            }),
          }
        );

        const responseBody = await response.json().catch(() => null);

       if (!response.ok) {
  console.error("RESEND ERROR:", {
    status: response.status,
    body: responseBody,
  });

  failures.push({
    guestId: guest.id,
    email: guest.email,
    error: JSON.stringify(responseBody),
  });

  continue;
}

         
        successfullySent.push(guest.id);
      } catch (error) {
        failures.push({
          guestId: guest.id,
          email: guest.email,
          error:
            error instanceof Error
              ? error.message
              : "Erro desconhecido no envio.",
        });
      }
    }

    if (successfullySent.length > 0) {
      await markSent(event.id, successfullySent);
    }

    return NextResponse.json({
      message:
        `${successfullySent.length} convite(s) enviado(s)` +
        (failures.length
          ? ` e ${failures.length} falha(s).`
          : "."),
      selected: recipients.length,
      sent: successfullySent.length,
      failed: failures.length,
      failures,
    });
  } catch (error) {
    console.error("Erro ao enviar convites:", error);

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
  values: {
    evento: string;
    nome: string;
    link: string;
  }
) {
  return template
    .replaceAll("{{evento}}", values.evento)
    .replaceAll("{{nome}}", values.nome)
    .replaceAll("{{link}}", values.link);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildEmailHtml({
  text,
  link,
  primaryColor,
  eventName,
}: {
  text: string;
  link: string;
  primaryColor: string;
  eventName: string;
}) {
  const formattedText = escapeHtml(text).replaceAll("\n", "<br>");

  return `
    <!doctype html>
    <html lang="pt-BR">
      <body style="margin:0;background:#f5f7fa;padding:24px;">
        <div style="
          max-width:620px;
          margin:0 auto;
          background:#ffffff;
          border-radius:12px;
          padding:32px;
          font-family:Arial,sans-serif;
          color:#17212b;
        ">
          <h1 style="margin-top:0;font-size:24px;">
            ${escapeHtml(eventName)}
          </h1>

          <div style="line-height:1.6;">
            ${formattedText}
          </div>

          <p style="margin:32px 0;">
            <a
              href="${escapeHtml(link)}"
              style="
                display:inline-block;
                background:${escapeHtml(primaryColor)};
                color:#ffffff;
                padding:14px 22px;
                border-radius:8px;
                text-decoration:none;
                font-weight:bold;
              "
            >
              Confirmar participação
            </a>
          </p>

          <p style="font-size:12px;color:#667085;">
            Este link é individual e está associado ao seu cadastro.
          </p>
        </div>
      </body>
    </html>
  `;
}