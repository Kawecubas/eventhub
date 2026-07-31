import { notFound } from "next/navigation";

import { getEvent } from "@/lib/event-platform-store";
import EventPublicForm from "./EventPublicForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

export default async function EventPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const rawToken = Array.isArray(query.token)
    ? query.token[0]
    : query.token;

  const token = rawToken?.trim();

  const event = await getEvent(slug);

  if (!event) {
    notFound();
  }

  if (!token) {
    return (
      <EventPublicForm
        event={event}
        guest={null}
        error="Link individual necessário"
      />
    );
  }

  const guest = event.guests.find(
    (item) =>
      String(item.token ?? "").trim() === token
  );

  if (!guest) {
    console.error("TOKEN NÃO LOCALIZADO", {
      slug,
      receivedToken: token,
      availableTokens: event.guests.map((item) => ({
        id: item.id,
        email: item.email,
        token: item.token,
      })),
    });

    return (
      <EventPublicForm
        event={event}
        guest={null}
        error="Link inválido ou convidado não localizado"
      />
    );
  }

  return (
    <EventPublicForm
      event={event}
      guest={guest}
      error={null}
    />
  );
}