import { notFound } from "next/navigation";
import { findGuest, getEvent } from "@/lib/event-platform-store";
import EventResponse from "./EventResponse";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const rawToken = Array.isArray(query.token) ? query.token[0] : query.token;
  const token = String(rawToken ?? "").trim();

  const event = await getEvent(slug);
  if (!event) notFound();

  if (!token) {
    return (
      <EventResponse
        event={event}
        guest={null}
        error="Link individual necessário."
      />
    );
  }

  const result = await findGuest(slug, token);

  if (!result) {
    return (
      <EventResponse
        event={event}
        guest={null}
        error="Convite não localizado ou expirado."
      />
    );
  }

  return <EventResponse event={result.event} guest={result.guest} />;
}
