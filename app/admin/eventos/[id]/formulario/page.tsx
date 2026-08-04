import { notFound, redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import { getEvent } from "@/lib/event-platform-store";

import EventNavigation from "../EventNavigation";
import FormBuilder from "./FormBuilder";

import "../editor.css";
import "./form-builder.css";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventFormBuilderPage({
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
      <EventNavigation eventId={event.id} />
      <FormBuilder event={event} />
    </>
  );
}
