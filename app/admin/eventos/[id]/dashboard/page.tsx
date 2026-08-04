import { notFound, redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import { getEvent } from "@/lib/event-platform-store";

import EventDashboard from "../EventDashboard";
import EventNavigation from "../EventNavigation";
import "../editor.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventDashboardPage({ params }: PageProps) {
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
      <EventNavigation eventId={event.id} />
      <EventDashboard event={event} />
    </>
  );
}
