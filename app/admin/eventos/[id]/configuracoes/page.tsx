import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import { getEvent } from "@/lib/event-platform-store";

import EventNavigation from "../EventNavigation";
import "../editor.css";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function EventSettingsPage({ params }: PageProps) {
  if (!(await isAdmin())) redirect("/admin/login");

  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  return (
    <>
      <EventNavigation eventId={event.id} />
      <main className="event-settings-page">
        <header>
          <small>EVENTO / CONFIGURAÇÕES</small>
          <h1>{event.name}</h1>
          <p>Administre as configurações complementares e ações críticas do evento.</p>
        </header>

        <section className="event-settings-card">
          <div>
            <small>ZONA DE PERIGO</small>
            <h2>Excluir evento</h2>
            <p>A exclusão remove convidados, respostas, tokens e registros de envio.</p>
          </div>
          <Link className="danger-link" href={`/admin/eventos/${event.id}/configuracoes/excluir`}>
            Abrir exclusão do evento
          </Link>
        </section>
      </main>
    </>
  );
}
