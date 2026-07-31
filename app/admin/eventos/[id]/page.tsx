import { notFound, redirect } from "next/navigation";

import EventEditor from "./EventEditor";
import { isAdmin } from "@/lib/admin-auth";
import { getEvent } from "@/lib/event-platform-store";

export const dynamic = "force-dynamic";

type PageProps = {
  params: {
    id: string;
  };
};

export default async function Page({ params }: PageProps) {
  const authenticated = await isAdmin();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const event = await getEvent(params.id);

  if (!event) {
    notFound();
  }

  return <EventEditor initial={event} />;
}