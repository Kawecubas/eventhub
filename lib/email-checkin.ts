import QRCode from "qrcode";

import { getCompanySettings } from "@/lib/company-settings";
import { sendEmail } from "@/lib/email-service";
import type { EventItem, EventGuest } from "@/lib/event-platform-store";

export async function sendCheckinEmail(
  event: EventItem,
  guest: EventGuest
): Promise<void> {
  if (!guest.checkinToken) return;

  const settings = await getCompanySettings();
  const language = guest.locale || "pt-BR";
  const copy = {
    "pt-BR": { title: "Inscrição confirmada! 🎉", hello: "Olá", confirmed: "Sua participação em", suffix: "foi confirmada com sucesso.", location: "Local", date: "Data", attendees: "Participantes", instruction: "Apresente o QR Code abaixo na entrada do evento para realizar seu check-in:", code: "Código de check-in" },
    en: { title: "Registration confirmed! 🎉", hello: "Hello", confirmed: "Your participation in", suffix: "has been confirmed.", location: "Location", date: "Date", attendees: "Attendees", instruction: "Show the QR code below at the event entrance to check in:", code: "Check-in code" },
    es: { title: "¡Inscripción confirmada! 🎉", hello: "Hola", confirmed: "Tu participación en", suffix: "ha sido confirmada.", location: "Lugar", date: "Fecha", attendees: "Participantes", instruction: "Presenta el código QR a continuación en la entrada para realizar el check-in:", code: "Código de check-in" },
    it: { title: "Iscrizione confermata! 🎉", hello: "Ciao", confirmed: "La tua partecipazione a", suffix: "è stata confermata.", location: "Luogo", date: "Data", attendees: "Partecipanti", instruction: "Mostra il codice QR qui sotto all'ingresso per effettuare il check-in:", code: "Codice di check-in" },
  }[language];

  // Gera o QR Code como Data URL (base64), sem precisar de anexo separado
  const qrDataUrl = await QRCode.toDataURL(guest.checkinToken, {
    width: 300,
    margin: 2,
  });

  const dataLabel = guest.selectedDate
    ? `<p><strong>${copy.date}:</strong> ${guest.selectedDate}</p>`
    : event.startInfo
    ? `<p><strong>${copy.date}:</strong> ${event.startInfo}</p>`
    : "";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 520px; margin: 0 auto;">
      <h2 style="color: ${event.primaryColor};">${copy.title}</h2>
      <p>${copy.hello}, <strong>${guest.name}</strong>!</p>
      <p>${copy.confirmed} <strong>${event.name}</strong> ${copy.suffix}</p>
      <p><strong>${copy.location}:</strong> ${event.location || "—"}</p>
      ${dataLabel}
      <p><strong>${copy.attendees}:</strong> ${guest.participants ?? 1}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p>${copy.instruction}</p>
      <div style="text-align: center; margin: 20px 0;">
        <img src="${qrDataUrl}" alt="QR Code de check-in" width="240" height="240" />
      </div>
      <p style="font-size: 12px; color: #888; text-align: center;">
        ${copy.code}: ${guest.checkinToken}
      </p>
    </div>
  `;

  const text = `Olá, ${guest.name}! Sua participação em ${event.name} foi confirmada. Local: ${
    event.location || "A definir"
  }. Apresente o código ${guest.checkinToken} na entrada do evento.`;

  await sendEmail(settings, {
    to: guest.email,
    subject: `Confirmação de presença: ${event.name}`,
    html,
    text,
  });
}
