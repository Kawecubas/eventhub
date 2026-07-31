import { findGuest, getEventBySlug } from "@/lib/event-platform-store";
import EventResponse from "./EventResponse";
import "./public.css";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { token?: string };
}) {
  const event = await getEventBySlug(params.slug);
  const found = searchParams.token
    ? await findGuest(params.slug, searchParams.token)
    : null;

  if (!event) return <main>Evento não encontrado.</main>;

  const style = {
    "--primary": event.primaryColor,
    "--secondary": event.secondaryColor,
  } as React.CSSProperties;

  return (
    <main className="public-event" style={style}>
      <header>
        {event.logo ? (
          <img src={event.logo} alt={event.name} />
        ) : (
          <strong>{event.name}</strong>
        )}
      </header>
      <section
        className="hero"
        style={
          event.banner
            ? {
                backgroundImage: `linear-gradient(#0008,#0008),url(${event.banner})`,
              }
            : undefined
        }
      >
        <div>
          <small>CONVITE ESPECIAL</small>
          <h1>{event.name}</h1>
          <p>{event.description}</p>
          <p className="meta">
            {event.location} {event.startInfo && `• ${event.startInfo}`}
          </p>
        </div>
      </section>
      <section className="response">
        {found ? (
          <EventResponse event={event} guest={found.guest} />
        ) : (
          <div>
            <h2>Link individual necessário</h2>
            <p>Abra o link recebido por e-mail para confirmar sua participação.</p>
          </div>
        )}
      </section>
      <footer>Gestão de eventos</footer>
    </main>
  );
}
