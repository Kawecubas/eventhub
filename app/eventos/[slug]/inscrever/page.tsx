import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/event-platform-store";
import PublicRegistration from "./PublicRegistration";
import "../public.css";
import "../form-builder-public.css";

export const dynamic = "force-dynamic";

export default async function PublicRegistrationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const style = { "--primary": event.primaryColor || "#173b57", "--secondary": event.secondaryColor || "#d5a44c" } as CSSProperties;
  return <main className="public-event" style={style}><PublicRegistration event={event} /></main>;
}
