import type { CSSProperties } from "react";
import { notFound } from "next/navigation";

import {
  findGuest,
  getEventBySlug,
} from "@/lib/event-platform-store";

import EventResponse from "./EventResponse";
import "./public.css";
import "./comprovante.css";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const rawToken = Array.isArray(query.token) ? query.token[0] : query.token;
  const token = String(rawToken ?? "").trim();

  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const result = token ? await findGuest(slug, token) : null;
  const guest = result?.guest ?? null;

  let error: string | null = null;
  if (!token) error = "Link individual necessário.";
  else if (!guest) error = "Convite não localizado ou expirado.";

  const pageStyle = {
    "--primary": event.primaryColor || "#173b57",
    "--secondary": event.secondaryColor || "#d5a44c",
  } as CSSProperties;

  const heroStyle: CSSProperties = event.banner
    ? {
        backgroundImage: `linear-gradient(90deg,rgba(5,24,43,.94),rgba(7,31,58,.62),rgba(13,24,70,.28)),url("${event.banner}")`,
      }
    : {
        background: `linear-gradient(135deg,${event.primaryColor || "#173b57"},${event.secondaryColor || "#d5a44c"})`,
      };

  const alreadyResponded = Boolean(guest?.respondedAt);

  return (
    <main className="public-event" style={pageStyle}>
      <header className="event-header no-print">
        <div className="event-header-content">
          {event.logo ? (
            <img className="event-logo" src={event.logo} alt={event.name} />
          ) : (
            <strong className="event-brand">{event.name}</strong>
          )}
        </div>
      </header>

      <section className="event-hero no-print" style={heroStyle}>
        <div className="event-hero-content">
          <span className="event-eyebrow">CONVITE ESPECIAL</span>
          <h1>{event.name}</h1>

          {event.description && (
            <p className="event-description">{event.description}</p>
          )}

          <div className="event-meta">
            {event.location && (
              <div><span>Local</span><strong>{event.location}</strong></div>
            )}
            {event.startInfo && (
              <div><span>Período</span><strong>{event.startInfo}</strong></div>
            )}
          </div>
        </div>
      </section>

      <section className={`event-content ${alreadyResponded ? "has-receipt" : ""}`}>
        {!alreadyResponded && !error && (
          <div className="event-content-heading no-print">
            <span>CONFIRMAÇÃO DE PRESENÇA</span>
            <h2>Confirme sua participação</h2>
            <p>Escolha a melhor data, informe a quantidade de participantes e registre sua resposta.</p>
          </div>
        )}

        <div className="event-card">
          <EventResponse event={event} guest={guest} error={error} />
        </div>
      </section>

      <footer className="event-footer no-print">Gestão de eventos</footer>
    </main>
  );
}
