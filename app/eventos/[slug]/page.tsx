import { notFound } from "next/navigation";

import { getEvent } from "@/lib/event-platform-store";
import EventResponse from "./EventResponse";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

export default async function Page({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const token = Array.isArray(query.token)
    ? query.token[0]
    : query.token;

  const event = await getEvent(slug);

  if (!event) {
    notFound();
  }

  if (!token) {
    return (
      <EventResponse
        event={event}
        guest={null}
        error="Link individual necessário."
      />
    );
  }

  const guest = event.guests.find(
    (g) => String(g.token).trim() === String(token).trim()
  );

  if (!guest) {
    return (
      <EventResponse
        event={event}
        guest={null}
        error="Convite não localizado ou expirado."
      />
    );
  }

  return (
    <EventResponse
      event={event}
      guest={guest}
      error={null}
    />
  );
}