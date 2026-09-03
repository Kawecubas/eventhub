import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { listEvents } from "@/lib/event-platform-store";
import { publicLocaleLabels, resolvePublicLocale } from "@/lib/public-i18n";
import "./style.css";
import "./guests.css";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const events = await listEvents();
  const guests = events.flatMap((event) => event.guests);
  const confirmed = guests.filter((guest) => guest.status === "confirmed");
  const declined = guests.filter((guest) => guest.status === "declined");
  const pending = guests.filter((guest) => guest.status === "pending");
  const responseRate = guests.length
    ? Math.round(((confirmed.length + declined.length) / guests.length) * 100)
    : 0;
  const guestList = events
    .flatMap((event) => event.guests.map((guest) => ({ event, guest })))
    .sort(
      (first, second) =>
        new Date(second.guest.createdAt).getTime() -
        new Date(first.guest.createdAt).getTime()
    );

  return (
    <div className="admin-page dashboard-page">
      <div className="admin-page-heading"><div><small>VISÃO EXECUTIVA</small><h1>Dashboard</h1><p>Acompanhe todos os eventos do ambiente.</p></div><Link className="dashboard-new" href="/admin/eventos/novo">+ Novo evento</Link></div>
      <section className="dashboard-metrics">
        <article><span>Eventos</span><strong>{events.length}</strong></article>
        <article className="green"><span>Confirmados</span><strong>{confirmed.length}</strong></article>
        <article className="amber"><span>Pendentes</span><strong>{pending.length}</strong></article>
        <article className="red"><span>Recusas</span><strong>{declined.length}</strong></article>
        <article className="blue"><span>Taxa de resposta</span><strong>{responseRate}%</strong></article>
      </section>
      <section className="dashboard-table admin-card">
        <div className="dashboard-table-title"><div><h2>Eventos recentes</h2><p>Resumo dos eventos cadastrados.</p></div><Link href="/admin/eventos">Ver todos</Link></div>
        {events.length ? <div className="dashboard-list">{events.slice(0,8).map((event)=>{const count=event.guests.filter((g)=>g.status==="confirmed").length;return <Link key={event.id} href={`/admin/eventos/${event.id}`}><div><strong>{event.name}</strong><span>{event.location||"Local não definido"}</span></div><div><b>{event.guests.length}</b><small>convidados</small></div><div><b>{count}</b><small>confirmados</small></div><em>{event.status}</em></Link>})}</div>:<p>Nenhum evento cadastrado.</p>}
      </section>
      <section className="dashboard-table admin-card dashboard-guests">
        <div className="dashboard-table-title"><div><h2>Convidados</h2><p>Lista única de participantes de todos os eventos.</p></div><strong>{guestList.length} cadastrados</strong></div>
        {guestList.length ? (
          <div className="dashboard-guest-table-wrap">
            <table className="dashboard-guest-table">
              <thead>
                <tr>
                  <th>Convidado</th>
                  <th>Evento</th>
                  <th>Idioma</th>
                  <th>Data escolhida</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {guestList.map(({ event, guest }) => (
                  <tr key={`${event.id}-${guest.id}`}>
                    <td><strong>{guest.name}</strong><small>{guest.email}</small></td>
                    <td><Link href={`/admin/eventos/${event.id}`}>{event.name}</Link></td>
                    <td>{publicLocaleLabels[resolvePublicLocale(guest.locale || event.defaultLocale)]}</td>
                    <td>{guest.selectedDate || "Não selecionada"}</td>
                    <td><span className={`dashboard-guest-status ${guest.status}`}>{guest.status === "confirmed" ? "Confirmado" : guest.status === "declined" ? "Recusado" : "Pendente"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p>Nenhum convidado cadastrado.</p>}
      </section>
    </div>
  );
}
