import { notFound } from "next/navigation";

import { findGuest, getEventBySlug } from "@/lib/event-platform-store";
import EventResponse from "./EventResponse";

import "./public.css";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

export default async function EventPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const rawToken = Array.isArray(query.token)
    ? query.token[0]
    : query.token;

  const token = rawToken?.trim() || "";

  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const result = token
    ? await findGuest(slug, token)
    : null;

  const guest = result?.guest ?? null;

  let error: string | null = null;

  if (!token) {
    error = "Link individual necessário.";
  } else if (!guest) {
    error = "Convite não localizado ou expirado.";
  }

  return (
    <main
      className="public-event"
      style={
        {
          "--primary": event.primaryColor || "#173b57",
          "--secondary": event.secondaryColor || "#d5a44c",
        } as React.CSSProperties
      }
    >
      <header className="event-header">
        <div className="event-header-content">
          {event.logo ? (
            <img
              className="event-logo"
              src={event.logo}
              alt={event.name}
            />
          ) : (
            <strong className="event-brand">{event.name}</strong>
          )}
        </div>
      </header>

      <section
        className="event-hero"
        style={
          event.banner
            ? {
                backgroundImage: `
                  linear-gradient(
                    90deg,
                    rgba(6, 37, 64, 0.90),
                    rgba(15, 25, 77, 0.55)
                  ),
                  url("${event.banner}")
                `,
              }
            : {
                background: `linear-gradient(
                  135deg,
                  ${event.primaryColor || "#173b57"},
                  ${event.secondaryColor || "#d5a44c"}
                )`,
              }
        }
      >
        <div className="event-hero-content">
          <span className="event-eyebrow">CONVITE ESPECIAL</span>

          <h1>{event.name}</h1>

          {event.description && (
            <p className="event-description">
              {event.description}
            </p>
          )}

          <div className="event-meta">
            {event.location && <strong>{event.location}</strong>}

            {event.startInfo && <span>{event.startInfo}</span>}
          </div>
        </div>
      </section>

      <section className="event-content">
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