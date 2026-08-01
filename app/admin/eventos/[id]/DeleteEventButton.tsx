"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeleteEventButtonProps = {
  eventId: string;
  eventName: string;
};

export default function DeleteEventButton({
  eventId,
  eventName,
}: DeleteEventButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [opened, setOpened] = useState(false);
  const [error, setError] = useState("");

  const canDelete =
    confirmation.trim().toLowerCase() ===
    eventName.trim().toLowerCase();

  async function deleteEvent() {
    if (!canDelete || loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/eventos/${encodeURIComponent(eventId)}`,
        {
          method: "DELETE",
        }
      );

const result = await response.json().catch(() => ({}));

if (!response.ok) {
  console.error(result);

  setError(
    result.error ||
    result.message ||
    JSON.stringify(result)
  );

  return;
}

      router.push("/admin/eventos");
      router.refresh();
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  if (!opened) {
    return (
      <button
        type="button"
        className="delete-event-trigger"
        onClick={() => setOpened(true)}
      >
        Excluir evento
      </button>
    );
  }

  return (
    <section className="delete-event-panel">
      <div>
        <strong>Excluir permanentemente este evento?</strong>

        <p>
          Essa ação excluirá o evento, seus convidados, tokens,
          respostas e registros de envio. Ela não poderá ser desfeita.
        </p>
      </div>

      <label>
        Digite <b>{eventName}</b> para confirmar
        <input
          value={confirmation}
          onChange={(event) =>
            setConfirmation(event.target.value)
          }
          placeholder={eventName}
          autoComplete="off"
        />
      </label>

      {error && (
        <div className="delete-event-error" role="alert">
          {error}
        </div>
      )}

      <div className="delete-event-actions">
        <button
          type="button"
          className="delete-event-cancel"
          onClick={() => {
            setOpened(false);
            setConfirmation("");
            setError("");
          }}
          disabled={loading}
        >
          Cancelar
        </button>

        <button
          type="button"
          className="delete-event-confirm"
          onClick={deleteEvent}
          disabled={!canDelete || loading}
        >
          {loading ? "Excluindo..." : "Excluir definitivamente"}
        </button>
      </div>
    </section>
  );
}