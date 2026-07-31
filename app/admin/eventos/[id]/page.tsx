import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { getEvent } from "@/lib/event-platform-store";
import EventEditor from "./EventEditor";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { id: string } }) {
  if (!isAdmin()) redirect("/admin/login");
  const event = await getEvent(params.id);
  if (!event) notFound();
  return <EventEditor initial={event} />;
}
