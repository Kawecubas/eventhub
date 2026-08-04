"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import QRCode from "qrcode";

import type {
  EventGuest,
  EventItem,
} from "@/lib/event-platform-store";

type EventResponseProps = {
  event: EventItem;
  guest: EventGuest | null;
  error?: string | null;
};

type ReceiptData = {
  status: "confirmed" | "declined";
  selectedDate?: string;
  notes?: string;
  participants?: number;
  respondedAt: string;
};

function formatDateTime(value?: string) {
  if (!value) return "Não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function parseEventDate(dateLabel?: string, startInfo?: string) {
  if (!dateLabel) return null;

  const dateMatch = dateLabel.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (!dateMatch) return null;

  const [, day, month, year] = dateMatch;
  const combinedText = `${dateLabel} ${startInfo ?? ""}`;
  const timeMatch = combinedText.match(/(?:às?|\s)(\d{1,2})(?::|h)(\d{2})?/i);

  const hour = timeMatch ? Number(timeMatch[1]) : 9;
  const minute = timeMatch?.[2] ? Number(timeMatch[2]) : 0;

  const start = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    hour,
    minute,
    0,
    0
  );

  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return { start, end };
}

function toGoogleDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function calendarLinks(event: EventItem, selectedDate?: string) {
  const parsed = parseEventDate(selectedDate, event.startInfo);
  if (!parsed) return null;

  const description = [
    event.description,
    `Data selecionada: ${selectedDate}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const google = new URL("https://calendar.google.com/calendar/render");
  google.searchParams.set("action", "TEMPLATE");
  google.searchParams.set("text", event.name);
  google.searchParams.set(
    "dates",
    `${toGoogleDate(parsed.start)}/${toGoogleDate(parsed.end)}`
  );
  google.searchParams.set("details", description);
  google.searchParams.set("location", event.location || "");

  const outlook = new URL(
    "https://outlook.live.com/calendar/0/deeplink/compose"
  );
  outlook.searchParams.set("path", "/calendar/action/compose");
  outlook.searchParams.set("rru", "addevent");
  outlook.searchParams.set("subject", event.name);
  outlook.searchParams.set("startdt", parsed.start.toISOString());
  outlook.searchParams.set("enddt", parsed.end.toISOString());
  outlook.searchParams.set("body", description);
  outlook.searchParams.set("location", event.location || "");

  return {
    google: google.toString(),
    outlook: outlook.toString(),
  };
}

export default function EventResponse({
  event,
  guest,
  error,
}: EventResponseProps) {
  if (error || !guest) {
    return (
      <section className="event-message">
        <h2>{error || "Convite não localizado."}</h2>
        <p>
          Abra o link individual recebido por e-mail ou solicite um novo
          convite ao organizador.
        </p>
      </section>
    );
  }

  if (guest.respondedAt) {
    return (
      <ConfirmationReceipt
        event={event}
        guest={guest}
        response={{
          status: guest.status === "declined" ? "declined" : "confirmed",
          selectedDate: guest.selectedDate,
          notes: guest.notes,
          participants: guest.participants || 1,
          respondedAt: guest.respondedAt,
        }}
      />
    );
  }

  return <ResponseForm event={event} guest={guest} />;
}

function ConfirmationReceipt({
  event,
  guest,
  response,
}: {
  event: EventItem;
  guest: EventGuest;
  response: ReceiptData;
}) {
  const [qrCode, setQrCode] = useState("");
  const confirmed = response.status === "confirmed";

  const links = useMemo(
    () =>
      confirmed
        ? calendarLinks(event, response.selectedDate)
        : null,
    [confirmed, event, response.selectedDate]
  );

  useEffect(() => {
    const invitationUrl = window.location.href;

    QRCode.toDataURL(invitationUrl, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then(setQrCode)
      .catch(() => setQrCode(""));
  }, []);

  return (
    <section className="confirmation-receipt">
      <div className="receipt-print-actions no-print">
        <button
          type="button"
          onClick={() => window.print()}
          aria-label="Imprimir confirmação ou salvar em PDF"
        >
          Imprimir / Salvar em PDF
        </button>
      </div>

      {event.banner && (
        <div className="receipt-banner">
          <img src={event.banner} alt={`Imagem do evento ${event.name}`} />
        </div>
      )}

      <div className="receipt-header">
        {event.logo && (
          <img className="receipt-logo" src={event.logo} alt={event.name} />
        )}

        <div className={`receipt-status ${confirmed ? "confirmed" : "declined"}`}>
          <span>{confirmed ? "✓" : "—"}</span>
          <div>
            <small>COMPROVANTE DE RESPOSTA</small>
            <h2>
              {confirmed
                ? "Participação confirmada"
                : "Ausência registrada"}
            </h2>
          </div>
        </div>
      </div>

      <p className="receipt-intro">
        Olá, <strong>{guest.name}</strong>. Sua resposta para o evento{" "}
        <strong>{event.name}</strong> foi registrada com sucesso.
      </p>

      <div className="receipt-content">
        <div className="receipt-details">
          <div>
            <span>Evento</span>
            <strong>{event.name}</strong>
          </div>

          <div>
            <span>Convidado</span>
            <strong>{guest.name}</strong>
          </div>

          {guest.company && (
            <div>
              <span>Empresa</span>
              <strong>{guest.company}</strong>
            </div>
          )}

          {confirmed && response.selectedDate && (
            <div>
              <span>Data escolhida</span>
              <strong>{response.selectedDate}</strong>
            </div>
          )}

          {confirmed && (
            <div>
              <span>Participantes</span>
              <strong>{response.participants || 1}</strong>
            </div>
          )}

          {event.location && (
            <div>
              <span>Local</span>
              <strong>{event.location}</strong>
            </div>
          )}

          <div>
            <span>Respondido em</span>
            <strong>{formatDateTime(response.respondedAt)}</strong>
          </div>

          {response.notes && (
            <div className="receipt-notes">
              <span>Observações</span>
              <strong>{response.notes}</strong>
            </div>
          )}
        </div>

        <aside className="receipt-qr">
          {qrCode ? (
            <img src={qrCode} alt="QR Code do convite" />
          ) : (
            <div className="qr-placeholder">Gerando QR Code...</div>
          )}
          <strong>Convite individual</strong>
          <span>Apresente este QR Code quando solicitado.</span>
        </aside>
      </div>

      {confirmed && (
        <div className="calendar-actions">
          <div>
            <strong>Adicione o evento à sua agenda</strong>
            <span>
              Os botões são exibidos quando a data contém dia, mês e ano.
            </span>
          </div>

          {links ? (
            <div className="calendar-buttons">
              <a href={links.google} target="_blank" rel="noreferrer">
                Google Agenda
              </a>
              <a href={links.outlook} target="_blank" rel="noreferrer">
                Outlook
              </a>
            </div>
          ) : (
            <span className="calendar-warning">
              Cadastre a data no padrão DD/MM/AAAA para habilitar a agenda.
            </span>
          )}
        </div>
      )}

      <p className="response-note">
        Para alterar a resposta, entre em contato com o organizador do evento.
      </p>
    </section>
  );
}

function ResponseForm({
  event,
  guest,
}: {
  event: EventItem;
  guest: EventGuest;
}) {
  const [status, setStatus] = useState<"confirmed" | "declined">(
    guest.status === "declined" ? "declined" : "confirmed"
  );
  const [selectedDate, setSelectedDate] = useState(guest.selectedDate || "");
  const [notes, setNotes] = useState(guest.notes || "");
  const [participants, setParticipants] = useState(guest.participants || 1);
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [submitError, setSubmitError] = useState("");

  async function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();

    if (status === "confirmed" && !selectedDate) {
      setSubmitError("Selecione uma data para participar.");
      return;
    }

    setLoading(true);
    setSubmitError("");

    try {
      const response = await fetch(
        `/api/eventos/${encodeURIComponent(event.slug)}/responder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: guest.token,
            status,
            selectedDate: status === "confirmed" ? selectedDate : "",
            notes,
            participants: status === "confirmed" ? participants : 1,
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setSubmitError(
          result?.error || "Não foi possível registrar sua resposta."
        );
        return;
      }

      setReceipt({
        status,
        selectedDate: status === "confirmed" ? selectedDate : undefined,
        notes,
        participants: status === "confirmed" ? participants : 1,
        respondedAt: new Date().toISOString(),
      });
    } catch {
      setSubmitError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  if (receipt) {
    return (
      <ConfirmationReceipt event={event} guest={guest} response={receipt} />
    );
  }

  return (
    <form onSubmit={submit}>
      <h2>Confirme sua participação</h2>

      <div className="identity">
        <label>
          Convidado
          <input readOnly value={guest.name} />
        </label>
        <label>
          Empresa
          <input readOnly value={guest.company || ""} />
        </label>
      </div>

      <div className="choice">
        <button
          type="button"
          className={status === "confirmed" ? "on" : ""}
          onClick={() => setStatus("confirmed")}
        >
          Quero participar
        </button>
        <button
          type="button"
          className={status === "declined" ? "on" : ""}
          onClick={() => {
            setStatus("declined");
            setSelectedDate("");
          }}
        >
          Não poderei participar
        </button>
      </div>

      {status === "confirmed" && (
        <fieldset>
          <legend>Escolha uma data</legend>
          {event.dates.map((eventDate) => (
            <label
              key={eventDate.id}
              className={selectedDate === eventDate.label ? "date on" : "date"}
            >
              <input
                type="radio"
                name="event-date"
                checked={selectedDate === eventDate.label}
                onChange={() => setSelectedDate(eventDate.label)}
              />
              {eventDate.label}
            </label>
          ))}
        </fieldset>
      )}


      {status === "confirmed" && (
        <div className="participant-quantity">
          <span>Quantidade de participantes</span>
          <div className="quantity-control" role="group" aria-label="Quantidade de participantes">
            <button
              type="button"
              onClick={() => setParticipants((current) => Math.max(1, current - 1))}
              disabled={participants <= 1}
              aria-label="Diminuir quantidade"
            >
              −
            </button>
            <strong aria-live="polite">{participants}</strong>
            <button
              type="button"
              onClick={() => setParticipants((current) => Math.min(10, current + 1))}
              disabled={participants >= 10}
              aria-label="Aumentar quantidade"
            >
              +
            </button>
          </div>
          <small>Inclua você e seus acompanhantes. Máximo de 10 pessoas por convite.</small>
        </div>
      )}

      <label>
        Observações
        <textarea
          value={notes}
          onChange={(changeEvent) => setNotes(changeEvent.target.value)}
        />
      </label>

      {submitError && (
        <div className="error" role="alert">
          {submitError}
        </div>
      )}

      <button className="submit" type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviar resposta"}
      </button>
    </form>
  );
}
