import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { listEvents } from "@/lib/event-platform-store";
import "./style.css";

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
    </div>
  );
}
