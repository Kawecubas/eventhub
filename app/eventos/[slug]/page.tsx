import type { CSSProperties } from "react";
import { notFound } from "next/navigation";

import {
  findGuest,
  getEventBySlug,
} from "@/lib/event-platform-store";

import EventResponse from "./EventResponse";

import "./public.css";
import "./comprovante.css";
import "./form-builder-public.css";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

export default async function Page({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const rawToken = Array.isArray(query.token)
    ? query.token[0]
    : query.token;

  const token = String(rawToken ?? "").trim();
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const result = token ? await findGuest(slug, token) : null;
  const guest = result?.guest ?? null;

  let error: string | null = null;

  if (!token) {
    error = "Link individual necessário.";
  } else if (!guest) {
    error = "Convite não localizado ou expirado.";
  }

  const pageStyle = {
    "--primary": event.primaryColor || "#173b57",
    "--secondary": event.secondaryColor || "#d5a44c",
  } as CSSProperties;

  const fallbackHeroStyle: CSSProperties = {
    background: `linear-gradient(
      135deg,
      ${event.primaryColor || "#173b57"},
      ${event.secondaryColor || "#d5a44c"}
    )`,
  };

  return (
    <main className="public-event" style={pageStyle}>
      <header className="event-header">
        <div className="event-header-content">
          {event.logo ? (
            <img
              className="event-logo"
              src={event.logo}
              alt={event.name}
            />
          ) : (
            <strong className="event-brand">
              {event.name}
            </strong>
          )}
        </div>
      </header>

      {event.banner ? (
        <section className="event-banner">
          <img
            src={event.banner}
            alt={`Banner do evento ${event.name}`}
          />
        </section>
      ) : (
        <section
          className="event-hero event-hero-without-banner"
          style={fallbackHeroStyle}
        >
          <div className="event-hero-content">
            <span className="event-eyebrow">
              CONVITE ESPECIAL
            </span>

            <h1>{event.name}</h1>

            {event.description && (
              <p className="event-description">
                {event.description}
              </p>
            )}

            <div className="event-meta">
              {event.location && (
                <strong>{event.location}</strong>
              )}

              {event.startInfo && (
                <span>{event.startInfo}</span>
              )}
            </div>
          </div>
        </section>
      )}

      <section
        className={`confirmation-section ${
          event.banner ? "has-banner" : "without-banner"
        }`}
      >
        <header className="confirmation-heading">
          <small>CONFIRMAÇÃO DE PRESENÇA</small>
          <h1>Confirme sua participação</h1>
          <p>
            Escolha a melhor data, informe a quantidade de
            participantes e registre sua resposta.
          </p>
        </header>

        <div className="event-card">
          <EventResponse
            event={event}
            guest={guest}
            error={error}
          />
        </div>
      </section>

      <footer className="event-footer">
        Gestão de eventos
      </footer>
    </main>
  );
}
