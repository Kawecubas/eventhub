import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { listEvents } from "@/lib/event-platform-store";
import "./style.css";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!isAdmin()) redirect("/admin/login");
  const events = await listEvents();

  return (
    <main className="ep">
      <header>
        <div>
          <small>EVENTHUB • GESTÃO DE EVENTOS</small>
          <h1>Eventos</h1>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a className="primary" href="/api/backup" download>
            Exportar backup
          </a>
          <Link className="primary" href="/admin/eventos/backup">
            Importar backup
          </Link>
          <Link className="primary" href="/admin/eventos/novo">
            + Novo evento
          </Link>
        </div>
      </header>

      <section className="grid">
        {events.map((event) => {
          const confirmed = event.guests.filter(
            (guest) => guest.status === "confirmed"
          ).length;

          return (
            <article key={event.id}>
              <div
                className="visual"
                style={{
                  background: `linear-gradient(135deg,${event.primaryColor},${event.secondaryColor})`,
                }}
              >
                {event.logo && <img src={event.logo} alt="" />}
              </div>
              <div className="body">
                <span className={`status ${event.status}`}>{event.status}</span>
                <h2>{event.name}</h2>
                <p>{event.location || "Local não definido"}</p>
                <div className="stats">
                  <b>{event.guests.length}</b> convidados <b>{confirmed}</b>{" "}
                  confirmados
                </div>
                <Link href={`/admin/eventos/${event.id}`}>
                  Gerenciar evento →
                </Link>
              </div>
            </article>
          );
        })}

        {events.length === 0 && (
          <div className="empty">
            <h2>Nenhum evento criado</h2>
            <p>
              Crie o primeiro evento e personalize logo, cores, datas e convite.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
