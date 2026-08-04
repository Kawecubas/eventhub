import { notFound, redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import { getEvent } from "@/lib/event-platform-store";

import DeleteEventButton from "../../DeleteEventButton";
import EventNavigation from "../../EventNavigation";
import "../../editor.css";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function DeleteEventPage({ params }: PageProps) {
  if (!(await isAdmin())) redirect("/admin/login");

  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  return (
    <>
      <EventNavigation eventId={event.id} />
      <main className="event-delete-page">
        <section className="danger-zone">
          <div>
            <span>ZONA DE PERIGO</span>
            <h1>Excluir evento</h1>
            <p>
              Exclua permanentemente <strong>{event.name}</strong> e todos os dados associados.
              Esta ação não poderá ser desfeita.
            </p>
          </div>
          <DeleteEventButton eventId={event.id} eventName={event.name} />
        </section>
      </main>
    </>
  );
}
