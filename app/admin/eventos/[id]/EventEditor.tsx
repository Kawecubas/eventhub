"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import type { EventItem } from "@/lib/event-platform-store";
import {
  publicLocaleLabels,
  publicLocales,
  type PublicLocale,
} from "@/lib/public-i18n";
import { publicEventUrl } from "@/lib/public-event-url";
import GuestImporter from "./GuestImporter";
import GenerateGenericLinkButton from "@/components/GenerateGenericLinkButton";
import "./editor.css";

const empty = {
  name: "",
  slug: "",
  defaultLocale: "pt-BR" as PublicLocale,
  description: "",
  location: "",
  startInfo: "",
  primaryColor: "#173b57",
  secondaryColor: "#d5a44c",
  logo: "",
  banner: "",
  emailFrom: "Eventos <eventos@seudominio.com>",
  emailSubject: "Convite: {{evento}}",
  emailBody:
    "Olá, {{nome}}. Você está convidado para {{evento}}. Confirme: {{link}}",
  status: "draft",
  dates: [],
  guests: [],
};

type EditorTab = "dados" | "visual" | "datas" | "convidados";

export default function EventEditor({
  initial,
  initialTab = "dados",
}: {
  initial?: EventItem;
  initialTab?: EditorTab;
}) {
  const router = useRouter();
  const [event, setEvent] = useState<any>(initial || empty);
  const [newDate, setNewDate] = useState("");
  const tab = initialTab;
  const [guestError, setGuestError] = useState("");
  const [deletingGuestId, setDeletingGuestId] = useState("");
  const pendingGuestIds = event.guests
    .filter(
      (guest: any) =>
        guest.status === "pending" &&
        !guest.sentAt &&
        guest.source !== "public_link"
    )
    .map((guest: any) => guest.id);

  async function file(field: string, selected?: File) {
    if (!selected) return;
    const reader = new FileReader();
    reader.onload = () => setEvent({ ...event, [field]: reader.result });
    reader.readAsDataURL(selected);
  }

  async function save() {
    const response = await fetch("/api/eventos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(event),
    });
    const data = await response.json();

    if (response.ok) {
      setEvent(data);
      router.replace(`/admin/eventos/${data.id}?aba=${tab}`);
      alert("Evento salvo.");
    }
  }

  async function addGuest(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setGuestError("");

    const formElement = formEvent.currentTarget;
    const formData = new FormData(formElement);
    const response = await fetch(`/api/eventos/${event.id}/convidados`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setGuestError(result.error || "Não foi possível cadastrar o convidado.");
      return;
    }

    setEvent({ ...event, guests: [result, ...event.guests] });
    formElement.reset();
  }

  async function deleteGuest(guestId: string, guestName: string) {
    const confirmed = window.confirm(
      `Excluir o convidado “${guestName}”? Esta ação removerá o token, a resposta e a data selecionada.`
    );

    if (!confirmed) return;

    setDeletingGuestId(guestId);
    setGuestError("");

    try {
      const response = await fetch(
        `/api/eventos/${event.id}/convidados?guestId=${encodeURIComponent(guestId)}`,
        { method: "DELETE" }
      );
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Não foi possível excluir o convidado.");
      }

      setEvent({
        ...event,
        guests: event.guests.filter((guest: any) => guest.id !== guestId),
      });
      router.refresh();
    } catch (caught) {
      setGuestError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível excluir o convidado."
      );
    } finally {
      setDeletingGuestId("");
    }
  }

  async function send(ids: string[]) {
    const response = await fetch(`/api/eventos/${event.id}/enviar`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ guestIds: ids }),
    });
    const data = await response.json();
    alert(data.message || data.error);
  }

  return (
    <main className="editor">
      <header>
        <button onClick={() => router.push("/admin/eventos")}>← Eventos</button>
        <h1>{event.name || "Novo evento"}</h1>
        <button className="save" onClick={save}>Salvar evento</button>
      </header>

      {tab === "dados" && (
        <section>
          <label>
            Nome
            <input
              value={event.name}
              onChange={(change) =>
                setEvent({
                  ...event,
                  name: change.target.value,
                  slug:
                    event.slug ||
                    change.target.value
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, ""),
                })
              }
            />
          </label>
          <label>
            Slug / endereço
            <input
              value={event.slug}
              onChange={(change) =>
                setEvent({ ...event, slug: change.target.value })
              }
              placeholder="meu-evento-2026"
            />
          </label>
          <label>
            Idioma principal do evento
            <select
              value={event.defaultLocale}
              onChange={(change) =>
                setEvent({
                  ...event,
                  defaultLocale: change.target.value as PublicLocale,
                })
              }
            >
              {publicLocales.map((locale) => (
                <option key={locale} value={locale}>
                  {publicLocaleLabels[locale]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Descrição
            <textarea
              value={event.description}
              onChange={(change) =>
                setEvent({ ...event, description: change.target.value })
              }
            />
          </label>
          <div className="cols">
            <label>
              Local
              <input
                value={event.location}
                onChange={(change) =>
                  setEvent({ ...event, location: change.target.value })
                }
              />
            </label>
            <label>
              Informações de horário
              <input
                value={event.startInfo}
                onChange={(change) =>
                  setEvent({ ...event, startInfo: change.target.value })
                }
              />
            </label>
          </div>
          <label>
            Status
            <select
              value={event.status}
              onChange={(change) =>
                setEvent({ ...event, status: change.target.value })
              }
            >
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
              <option value="closed">Encerrado</option>
            </select>
          </label>
          {event.id && (
            <div style={{ marginTop: 20 }}>
              <strong>Link público para divulgação</strong>
              <p>Permite inscrições sem convite individual.</p>
              <GenerateGenericLinkButton eventId={event.id} />
            </div>
          )}
        </section>
      )}

      {tab === "visual" && (
        <section>
          <div className="cols">
            <label>
              Cor principal
              <input
                type="color"
                value={event.primaryColor}
                onChange={(change) =>
                  setEvent({ ...event, primaryColor: change.target.value })
                }
              />
            </label>
            <label>
              Cor de apoio
              <input
                type="color"
                value={event.secondaryColor}
                onChange={(change) =>
                  setEvent({ ...event, secondaryColor: change.target.value })
                }
              />
            </label>
          </div>
          <label>
            Logo
            <input
              type="file"
              accept="image/*"
              onChange={(change) => file("logo", change.target.files?.[0])}
            />
          </label>
          <label>
            Banner
            <input
              type="file"
              accept="image/*"
              onChange={(change) => file("banner", change.target.files?.[0])}
            />
          </label>
          <div
            className="preview"
            style={{
              background: event.banner
                ? `linear-gradient(#0007,#0007),url(${event.banner}) center/cover`
                : `linear-gradient(135deg,${event.primaryColor},${event.secondaryColor})`,
            }}
          >
            {event.logo && <img src={event.logo} alt="Logo do evento" />}
            <h2>{event.name || "Nome do evento"}</h2>
            <p>{event.description || "Descrição do evento"}</p>
          </div>
        </section>
      )}

      {tab === "datas" && (
        <section>
          <h2>Datas disponíveis</h2>
          <div className="inline">
            <input
              placeholder="Ex.: 05/08/2026 às 19h"
              value={newDate}
              onChange={(change) => setNewDate(change.target.value)}
            />
            <button
              type="button"
              onClick={() => {
                if (!newDate) return;
                setEvent({
                  ...event,
                  dates: [
                    ...event.dates,
                    { id: crypto.randomUUID(), label: newDate },
                  ],
                });
                setNewDate("");
              }}
            >
              Adicionar
            </button>
          </div>
          {event.dates.map((date: any) => (
            <div className="date" key={date.id}>
              {date.label}
              <button
                type="button"
                onClick={() =>
                  setEvent({
                    ...event,
                    dates: event.dates.filter((item: any) => item.id !== date.id),
                  })
                }
              >
                Excluir
              </button>
            </div>
          ))}
        </section>
      )}

      {tab === "convidados" && (
        <section>
          <h2>Convidados</h2>
          {event.id ? (
            <>
              <form className="guest" onSubmit={addGuest}>
                <input name="name" placeholder="Nome" required />
                <input name="company" placeholder="Empresa" />
                <input name="email" type="email" placeholder="E-mail" required />
                <input name="phone" placeholder="Telefone" />
                <button>Adicionar</button>
              </form>

              <GuestImporter
                eventId={event.id}
                onImported={(guests) =>
                  setEvent({ ...event, guests: [...guests, ...event.guests] })
                }
              />

              <div className="guest-toolbar">
                <div className="guest-toolbar-actions">
                  <a
                    className="export-guests-button"
                    href={`/api/eventos/${event.id}/exportar-convidados`}
                  >
                    Exportar lista de convidados
                  </a>
                  <button
                    type="button"
                    disabled={pendingGuestIds.length === 0}
                    onClick={() => send(pendingGuestIds)}
                  >
                    Enviar para pendentes ({pendingGuestIds.length})
                  </button>
                </div>
                <span>{event.guests.length} convidados cadastrados</span>
              </div>

              {guestError && <div className="guest-error">{guestError}</div>}

              <div className="guest-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Status</th>
                      <th>Data</th>
                      <th>Convite</th>
                      <th>Link</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.guests.map((guest: any) => (
                      <tr key={guest.id}>
                        <td>
                          {guest.name}
                          <small>
                            {guest.email}
                            {guest.company ? ` · ${guest.company}` : ""}
                          </small>
                        </td>
                        <td>{guest.status}</td>
                        <td>{guest.selectedDate || "—"}</td>
                        <td>{guest.sentAt ? "Enviado" : "Não enviado"}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                publicEventUrl(
                                  `/eventos/${event.slug}?token=${encodeURIComponent(guest.token)}`
                                )
                              )
                            }
                          >
                            Copiar
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="delete-guest-button"
                            disabled={deletingGuestId === guest.id}
                            onClick={() => deleteGuest(guest.id, guest.name)}
                          >
                            {deletingGuestId === guest.id
                              ? "Excluindo..."
                              : "Excluir"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p>Salve o evento antes de cadastrar convidados.</p>
          )}
        </section>
      )}
    </main>
  );
}
