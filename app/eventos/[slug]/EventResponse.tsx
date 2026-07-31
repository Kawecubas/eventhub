"use client";

import { useState } from "react";

import type {
  EventGuest,
  EventItem,
} from "@/lib/event-platform-store";

type EventResponseProps = {
  event: EventItem;
  guest: EventGuest | null;
  error?: string | null;
};

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
          convite ao organizador do evento.
        </p>
      </section>
    );
  }

  return <ResponseForm event={event} guest={guest} />;
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

  const [date, setDate] = useState(guest.selectedDate || "");
  const [notes, setNotes] = useState(guest.notes || "");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function submit(eventSubmit: React.FormEvent<HTMLFormElement>) {
    eventSubmit.preventDefault();

    setLoading(true);
    setSubmitError("");

    try {
      const response = await fetch(
        `/api/eventos/${encodeURIComponent(event.slug)}/responder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: guest.token,
            status,
            selectedDate: status === "confirmed" ? date : "",
            notes,
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

      setDone(true);
    } catch {
      setSubmitError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="success">
        <b>✓</b>
        <h2>Resposta registrada</h2>
        <p>Obrigado, {guest.name}.</p>
      </div>
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
            setDate("");
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
              className={
                date === eventDate.label ? "date on" : "date"
              }
              key={eventDate.id}
            >
              <input
                type="radio"
                name="event-date"
                required
                checked={date === eventDate.label}
                onChange={() => setDate(eventDate.label)}
              />

              {eventDate.label}
            </label>
          ))}
        </fieldset>
      )}

      <label>
        Observações
        <textarea
          value={notes}
          onChange={(changeEvent) =>
            setNotes(changeEvent.target.value)
          }
        />
      </label>

      {submitError && (
        <div className="error" role="alert">
          {submitError}
        </div>
      )}

      <button
        className="submit"
        type="submit"
        disabled={loading}
      >
        {loading ? "Enviando..." : "Enviar resposta"}
      </button>
    </form>
  );
}