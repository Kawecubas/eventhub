import QRCode from "qrcode";

import { getCompanySettings } from "@/lib/company-settings";
import { sendEmail } from "@/lib/email-service";
import { listSystemEmailTemplates } from "@/lib/email-template-store";
import { replaceEmailVariables } from "@/lib/email-template-builder";
import type { EventItem, EventGuest } from "@/lib/event-platform-store";
import { publicEventUrl } from "@/lib/public-event-url";
import { resolvePublicLocale, type PublicLocale } from "@/lib/public-i18n";

type ConfirmationCopy = {
  subject: string;
  title: string;
  hello: string;
  confirmed: string;
  suffix: string;
  location: string;
  date: string;
  attendees: string;
  instruction: string;
  code: string;
};

const confirmationCopy: Record<PublicLocale, ConfirmationCopy> = {
  "pt-BR": { subject: "Confirmação de presença", title: "Inscrição confirmada!", hello: "Olá", confirmed: "Sua participação em", suffix: "foi confirmada com sucesso.", location: "Local", date: "Data", attendees: "Participantes", instruction: "Apresente o QR Code abaixo na entrada do evento para realizar seu check-in:", code: "Código de check-in" },
  en: { subject: "Attendance confirmation", title: "Registration confirmed!", hello: "Hello", confirmed: "Your participation in", suffix: "has been confirmed.", location: "Location", date: "Date", attendees: "Attendees", instruction: "Show the QR code below at the event entrance to check in:", code: "Check-in code" },
  es: { subject: "Confirmación de asistencia", title: "¡Inscripción confirmada!", hello: "Hola", confirmed: "Tu participación en", suffix: "ha sido confirmada.", location: "Lugar", date: "Fecha", attendees: "Participantes", instruction: "Presenta el código QR a continuación en la entrada para realizar el check-in:", code: "Código de check-in" },
  it: { subject: "Conferma di partecipazione", title: "Iscrizione confermata!", hello: "Ciao", confirmed: "La tua partecipazione a", suffix: "è stata confermata.", location: "Luogo", date: "Data", attendees: "Partecipanti", instruction: "Mostra il codice QR qui sotto all'ingresso per effettuare il check-in:", code: "Codice di check-in" },
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function defaultConfirmationHtml(
  event: EventItem,
  guest: EventGuest,
  copy: ConfirmationCopy,
  qrImage: string
): string {
  const date = guest.selectedDate || event.startInfo;

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:520px;margin:0 auto;">
      <h2 style="color:${escapeHtml(event.primaryColor)};">${copy.title}</h2>
      <p>${copy.hello}, <strong>${escapeHtml(guest.name)}</strong>!</p>
      <p>${copy.confirmed} <strong>${escapeHtml(event.name)}</strong> ${copy.suffix}</p>
      <p><strong>${copy.location}:</strong> ${escapeHtml(event.location || "—")}</p>
      ${date ? `<p><strong>${copy.date}:</strong> ${escapeHtml(date)}</p>` : ""}
      <p><strong>${copy.attendees}:</strong> ${guest.participants ?? 1}</p>
      ${qrImage}
    </div>
  `;
}

function appendQrCode(html: string, qrImage: string): string {
  return html.includes("</body>")
    ? html.replace("</body>", `${qrImage}</body>`)
    : `${html}${qrImage}`;
}

export async function sendCheckinEmail(
  event: EventItem,
  guest: EventGuest
): Promise<void> {
  if (!guest.checkinToken) return;

  const settings = await getCompanySettings();
  const language = resolvePublicLocale(event.defaultLocale);
  const copy = confirmationCopy[language];
  const qrDataUrl = await QRCode.toDataURL(guest.checkinToken, {
    width: 300,
    margin: 2,
  });
  const qrImage = `
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
    <p>${copy.instruction}</p>
    <div style="text-align:center;margin:20px 0;">
      <img src="${qrDataUrl}" alt="${copy.code}" width="240" height="240">
    </div>
    <p style="font-size:12px;color:#888;text-align:center;">${copy.code}: ${escapeHtml(guest.checkinToken)}</p>
  `;
  const link = publicEventUrl(
    `/eventos/${event.slug}?token=${encodeURIComponent(guest.token)}`
  );
  const date = guest.selectedDate || event.startInfo || "";
  const templates = await listSystemEmailTemplates();
  const template = templates.find(
    (item) =>
      item.active &&
      item.type === "confirmation" &&
      item.locale === language
  );
  const values = {
    nome: escapeHtml(guest.name),
    empresa: escapeHtml(guest.company || ""),
    evento: escapeHtml(event.name),
    data: escapeHtml(date),
    local: escapeHtml(event.location || ""),
    participantes: String(guest.participants ?? 1),
    link: escapeHtml(link),
    qr_code: qrImage,
    codigo_checkin: escapeHtml(guest.checkinToken),
  };
  const renderedTemplate = template
    ? replaceEmailVariables(template.html, values)
    : "";
  const html = template
    ? template.html.includes("{{qr_code}}")
      ? renderedTemplate
      : appendQrCode(renderedTemplate, qrImage)
    : defaultConfirmationHtml(event, guest, copy, qrImage);
  const subject = template
    ? replaceEmailVariables(template.subject, {
        ...values,
        nome: guest.name,
        empresa: guest.company || "",
        evento: event.name,
        data: date,
        local: event.location || "",
      })
    : `${copy.subject}: ${event.name}`;
  const text = `${copy.hello}, ${guest.name}! ${copy.confirmed} ${event.name} ${copy.suffix} ${copy.location}: ${event.location || "—"}. ${copy.code}: ${guest.checkinToken}`;

  await sendEmail(settings, {
    to: guest.email,
    subject,
    html,
    text,
  });
}
