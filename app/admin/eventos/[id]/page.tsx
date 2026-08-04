import { notFound, redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import { getEvent } from "@/lib/event-platform-store";

import EventEditor from "./EventEditor";
import EventNavigation from "./EventNavigation";
import "./editor.css";

export const dynamic = "force-dynamic";

type EditorTab = "dados" | "visual" | "datas" | "convidados";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string | string[] }>;
};

function resolveTab(value: string | string[] | undefined): EditorTab {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "visual" || raw === "datas" || raw === "convidados"
    ? raw
    : "dados";
}

export default async function Page({ params, searchParams }: PageProps) {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const query = await searchParams;
  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  return (
    <>
      <EventNavigation eventId={event.id} />
      <EventEditor initial={event} initialTab={resolveTab(query.aba)} />
    </>
  );
}
