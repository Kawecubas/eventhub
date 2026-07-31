import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";

export type EventDate = { id: string; label: string; capacity?: number };
export type EventGuest = {
  id: string;
  token: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  status: "pending" | "confirmed" | "declined";
  selectedDate?: string;
  notes?: string;
  sentAt?: string;
  respondedAt?: string;
  createdAt: string;
};
export type EventItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  location: string;
  startInfo: string;
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  banner?: string;
  emailFrom: string;
  emailSubject: string;
  emailBody: string;
  status: "draft" | "published" | "closed";
  dates: EventDate[];
  guests: EventGuest[];
  createdAt: string;
  updatedAt: string;
};

export type GuestImportInput = {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  row?: number;
};
export type GuestImportResult = {
  created: EventGuest[];
  duplicates: GuestImportInput[];
  invalid: { row?: number; reason: string; data: GuestImportInput }[];
};

function database() {
  const url =
    process.env.event_hub_POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.event_hub_DATABASE_URL_UNPOOLED ||
    process.env.event_hub_POSTGRES_URL_NON_POOLING ||
    process.env.eventhub_POSTGRES_URL ||
    process.env.eventhub_POSTGRES_PRISMA_URL;

  if (!url) {
    throw new Error(
      "Banco não configurado. Defina event_hub_POSTGRES_URL ou DATABASE_URL na Vercel."
    );
  }
  return neon(url);
}

let initialized: Promise<void> | null = null;
function ensureDatabase(): Promise<void> {
  if (!initialized) {
    initialized = (async () => {
      const sql = database();
      await sql`
        CREATE TABLE IF NOT EXISTS eventhub_events (
          id TEXT PRIMARY KEY,
          slug TEXT NOT NULL UNIQUE,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS eventhub_events_updated_at_idx
        ON eventhub_events (updated_at DESC)
      `;
    })().catch((error) => {
      initialized = null;
      throw error;
    });
  }
  return initialized;
}

function normalizeEvent(value: unknown): EventItem {
  const event = value as EventItem;
  return {
    ...event,
    dates: Array.isArray(event.dates) ? event.dates : [],
    guests: Array.isArray(event.guests) ? event.guests : [],
  };
}

async function persistEvent(event: EventItem): Promise<EventItem> {
  await ensureDatabase();
  const sql = database();
  await sql`
    INSERT INTO eventhub_events (id, slug, data, created_at, updated_at)
    VALUES (
      ${event.id},
      ${event.slug},
      ${JSON.stringify(event)}::jsonb,
      ${event.createdAt},
      ${event.updatedAt}
    )
    ON CONFLICT (id) DO UPDATE SET
      slug = EXCLUDED.slug,
      data = EXCLUDED.data,
      updated_at = EXCLUDED.updated_at
  `;
  return event;
}

export async function listEvents(): Promise<EventItem[]> {
  await ensureDatabase();
  const sql = database();
  const rows = await sql`
    SELECT data
    FROM eventhub_events
    ORDER BY updated_at DESC
  `;
  return rows.map((row) => normalizeEvent(row.data));
}

export async function getEvent(id: string): Promise<EventItem | undefined> {
  await ensureDatabase();
  const sql = database();
  const rows = await sql`
    SELECT data
    FROM eventhub_events
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ? normalizeEvent(rows[0].data) : undefined;
}

export async function getEventBySlug(slug: string): Promise<EventItem | undefined> {
  await ensureDatabase();
  const sql = database();
  const rows = await sql`
    SELECT data
    FROM eventhub_events
    WHERE slug = ${slug}
    LIMIT 1
  `;
  return rows[0] ? normalizeEvent(rows[0].data) : undefined;
}

export async function saveEvent(
  input: Partial<EventItem> & { name: string; slug: string }
): Promise<EventItem> {
  const now = new Date().toISOString();
  const existing = input.id ? await getEvent(input.id) : undefined;
  const base: EventItem = existing ?? {
    id: crypto.randomUUID(),
    slug: input.slug,
    name: input.name,
    description: "",
    location: "",
    startInfo: "",
    primaryColor: "#173b57",
    secondaryColor: "#d5a44c",
    emailFrom: "Eventos <eventos@seudominio.com>",
    emailSubject: "Convite: {{evento}}",
    emailBody:
      "Olá, {{nome}}. Você está convidado para o evento {{evento}}. Confirme sua participação: {{link}}",
    status: "draft",
    dates: [],
    guests: [],
    createdAt: now,
    updatedAt: now,
  };

  const event: EventItem = normalizeEvent({
    ...base,
    ...input,
    id: base.id,
    createdAt: base.createdAt,
    updatedAt: now,
  });

  return persistEvent(event);
}

export async function removeEvent(id: string): Promise<boolean> {
  await ensureDatabase();
  const sql = database();
  const rows = await sql`
    DELETE FROM eventhub_events
    WHERE id = ${id}
    RETURNING id
  `;
  return rows.length > 0;
}

export async function addGuest(
  eventId: string,
  input: { name: string; company?: string; email: string; phone?: string }
): Promise<EventGuest | null> {
  const event = await getEvent(eventId);
  if (!event) return null;

  const email = input.email.trim().toLowerCase();
  if (event.guests.some((guest) => guest.email.trim().toLowerCase() === email)) {
    throw new Error("Já existe um convidado com este e-mail no evento.");
  }

  const guest: EventGuest = {
    id: crypto.randomUUID(),
    token: crypto.randomBytes(18).toString("hex"),
    name: input.name.trim(),
    company: (input.company ?? "").trim(),
    email,
    phone: (input.phone ?? "").trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  event.guests.unshift(guest);
  event.updatedAt = new Date().toISOString();
  await persistEvent(event);
  return guest;
}

export async function deleteGuest(eventId: string, guestId: string): Promise<boolean> {
  const event = await getEvent(eventId);
  if (!event) return false;
  const previousLength = event.guests.length;
  event.guests = event.guests.filter((guest) => guest.id !== guestId);
  if (event.guests.length === previousLength) return false;
  event.updatedAt = new Date().toISOString();
  await persistEvent(event);
  return true;
}

export async function findGuest(
  slug: string,
  token: string
): Promise<{ event: EventItem; guest: EventGuest } | null> {
  const event = await getEventBySlug(slug);
  const guest = event?.guests.find((item) => item.token === token);
  return event && guest ? { event, guest } : null;
}

export async function respond(
  slug: string,
  token: string,
  input: {
    status: "confirmed" | "declined";
    selectedDate?: string;
    notes?: string;
  }
): Promise<EventGuest | null> {
  const event = await getEventBySlug(slug);
  const guest = event?.guests.find((item) => item.token === token);
  if (!event || !guest) return null;

  guest.status = input.status;
  guest.selectedDate = input.status === "confirmed" ? input.selectedDate : "";
  guest.notes = input.notes ?? "";
  guest.respondedAt = new Date().toISOString();
  event.updatedAt = guest.respondedAt;
  await persistEvent(event);
  return guest;
}

export async function markSent(eventId: string, guestIds: string[]): Promise<void> {
  const event = await getEvent(eventId);
  if (!event) return;
  const now = new Date().toISOString();
  event.guests.forEach((guest) => {
    if (guestIds.includes(guest.id)) guest.sentAt = now;
  });
  event.updatedAt = now;
  await persistEvent(event);
}

export async function importGuests(
  eventId: string,
  rows: GuestImportInput[],
  duplicateMode: "skip" | "update" = "skip"
): Promise<GuestImportResult> {
  const event = await getEvent(eventId);
  if (!event) throw new Error("Evento não encontrado");

  const result: GuestImportResult = { created: [], duplicates: [], invalid: [] };
  const existingByEmail = new Map(
    event.guests.map((guest) => [guest.email.trim().toLowerCase(), guest])
  );
  const seen = new Set<string>();
  const now = new Date().toISOString();

  for (const row of rows) {
    const name = (row.name ?? "").trim();
    const company = (row.company ?? "").trim();
    const email = (row.email ?? "").trim().toLowerCase();
    const phone = (row.phone ?? "").trim();
    const data = { ...row, name, company, email, phone };

    if (!name) {
      result.invalid.push({ row: row.row, reason: "Nome obrigatório", data });
      continue;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      result.invalid.push({ row: row.row, reason: "E-mail inválido", data });
      continue;
    }
    if (seen.has(email)) {
      result.invalid.push({ row: row.row, reason: "E-mail duplicado no arquivo", data });
      continue;
    }
    seen.add(email);

    const existing = existingByEmail.get(email);
    if (existing) {
      result.duplicates.push(data);
      if (duplicateMode === "update") {
        existing.name = name;
        existing.company = company;
        existing.phone = phone;
      }
      continue;
    }

    const guest: EventGuest = {
      id: crypto.randomUUID(),
      token: crypto.randomBytes(18).toString("hex"),
      name,
      company,
      email,
      phone,
      status: "pending",
      createdAt: now,
    };
    event.guests.unshift(guest);
    existingByEmail.set(email, guest);
    result.created.push(guest);
  }

  event.updatedAt = now;
  await persistEvent(event);
  return result;
}
