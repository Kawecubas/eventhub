import { notFound, redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import { getEvent } from "@/lib/event-platform-store";

import EventDashboard from "./EventDashboard";
import EventEditor from "./EventEditor";
import DeleteEventButton from "./DeleteEventButton";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({
  params,
}: PageProps) {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  return (
    <>
      <EventDashboard event={event} />
      <EventEditor initial={event} />
    </>
  );

  return (
  <>
    <EventDashboard event={event} />

    <EventEditor initial={event} />

    <section className="danger-zone">
      <div>
        <span>ZONA DE PERIGO</span>
        <h2>Excluir evento</h2>
        <p>
          Exclua permanentemente o evento e todos os seus dados.
        </p>
      </div>

      <DeleteEventButton
        eventId={event.id}
        eventName={event.name}
      />
    </section>
  </>
);
}