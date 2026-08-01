import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";

export type EventDate = {
  id: string;
  label: string;
  capacity?: number;
};

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
  invalid: Array<{
    row?: number;
    reason: string;
    data: GuestImportInput;
  }>;
};

function getDatabaseUrl(): string {
  const url =
    process.env.event_hub_POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.event_hub_DATABASE_URL_UNPOOLED ||
    process.env.event_hub_POSTGRES_URL_NON_POOLING ||
    process.env.eventhub_POSTGRES_URL ||
    process.env.eventhub_POSTGRES_PRISMA_URL;

  if (!url) {
    throw new Error(
      "Banco não configurado. Defina DATABASE_URL ou event_hub_POSTGRES_URL na Vercel."
    );
  }

  return url;
}

function database() {
  return neon(getDatabaseUrl());
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

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeEvent(value: unknown): EventItem {
  const source = (value ?? {}) as Partial<EventItem>;
  const now = new Date().toISOString();

  return {
    id: String(source.id ?? ""),
    slug: normalizeSlug(String(source.slug ?? "")),
    name: String(source.name ?? ""),
    description: String(source.description ?? ""),
    location: String(source.location ?? ""),
    startInfo: String(source.startInfo ?? ""),
    primaryColor: String(source.primaryColor ?? "#173b57"),
    secondaryColor: String(source.secondaryColor ?? "#d5a44c"),
    logo: source.logo ? String(source.logo) : undefined,
    banner: source.banner ? String(source.banner) : undefined,
    emailFrom: String(
      source.emailFrom || process.env.EMAIL_FROM || "Eventos <eventos@seudominio.com>"
    ),
    emailSubject: String(source.emailSubject ?? "Convite: {{evento}}"),
    emailBody: String(
      source.emailBody ??
        "Olá, {{nome}}. Você está convidado para o evento {{evento}}. Confirme sua participação: {{link}}"
    ),
    status:
      source.status === "published" || source.status === "closed"
        ? source.status
        : "draft",
    dates: Array.isArray(source.dates)
      ? source.dates.map((date) => ({
          id: String(date.id),
          label: String(date.label),
          capacity:
            typeof date.capacity === "number" ? date.capacity : undefined,
        }))
      : [],
    guests: Array.isArray(source.guests)
      ? source.guests.map((guest) => ({
          id: String(guest.id),
          token: String(guest.token ?? "").trim(),
          name: String(guest.name ?? ""),
          company: String(guest.company ?? ""),
          email: String(guest.email ?? "").trim().toLowerCase(),
          phone: guest.phone ? String(guest.phone) : undefined,
          status:
            guest.status === "confirmed" || guest.status === "declined"
              ? guest.status
              : "pending",
          selectedDate: guest.selectedDate
            ? String(guest.selectedDate)
            : undefined,
          notes: guest.notes ? String(guest.notes) : undefined,
          sentAt: guest.sentAt ? String(guest.sentAt) : undefined,
          respondedAt: guest.respondedAt
            ? String(guest.respondedAt)
            : undefined,
          createdAt: String(guest.createdAt ?? now),
        }))
      : [],
    createdAt: String(source.createdAt ?? now),
    updatedAt: String(source.updatedAt ?? now),
  };
}

async function persistEvent(input: EventItem): Promise<EventItem> {
  await ensureDatabase();

  const event = normalizeEvent(input);
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

/**
 * Localiza o evento tanto pelo UUID quanto pelo slug público.
 * Isso corrige o 404 em URLs como /eventos/gambini.
 */
export async function getEvent(
  idOrSlug: string
): Promise<EventItem | undefined> {
  await ensureDatabase();
  const sql = database();
  const value = String(idOrSlug ?? "").trim();

  if (!value) return undefined;

  const rows = await sql`
    SELECT data
    FROM eventhub_events
    WHERE id = ${value} OR slug = ${normalizeSlug(value)}
    LIMIT 1
  `;

  return rows[0] ? normalizeEvent(rows[0].data) : undefined;
}

export async function getEventBySlug(
  slug: string
): Promise<EventItem | undefined> {
  return getEvent(slug);
}

export async function saveEvent(
  input: Partial<EventItem> & { name: string; slug: string }
): Promise<EventItem> {
  const now = new Date().toISOString();
  const existing = input.id ? await getEvent(input.id) : undefined;

  const base: EventItem = existing ?? {
    id: crypto.randomUUID(),
    slug: normalizeSlug(input.slug),
    name: input.name,
    description: "",
    location: "",
    startInfo: "",
    primaryColor: "#173b57",
    secondaryColor: "#d5a44c",
    emailFrom:
      process.env.EMAIL_FROM || "Eventos <eventos@seudominio.com>",
    emailSubject: "Convite: {{evento}}",
    emailBody:
      "Olá, {{nome}}. Você está convidado para o evento {{evento}}. Confirme sua participação: {{link}}",
    status: "draft",
    dates: [],
    guests: [],
    createdAt: now,
    updatedAt: now,
  };

  const event = normalizeEvent({
    ...base,
    ...input,
    id: base.id,
    slug: normalizeSlug(input.slug),
    createdAt: base.createdAt,
    updatedAt: now,
  });

  if (!event.name || !event.slug) {
    throw new Error("Nome e slug do evento são obrigatórios.");
  }

  return persistEvent(event);
}

export async function removeEvent(id: string) {
  console.log("removeEvent()");

  console.log("ID:", id);

  await ensureDatabase();

  const sql = database();

  console.log("Executando DELETE...");

  const result = await sql`
    DELETE FROM eventhub_events
    WHERE id = ${id}
    RETURNING id
  `;

  console.log("Resultado:", result);

  return result.length > 0;
}

export async function addGuest(
  eventId: string,
  input: {
    name: string;
    company?: string;
    email: string;
    phone?: string;
  }
): Promise<EventGuest | null> {
  const event = await getEvent(eventId);
  if (!event) return null;

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name) throw new Error("Nome do convidado é obrigatório.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("E-mail inválido.");
  }

  if (event.guests.some((guest) => guest.email === email)) {
    throw new Error("Já existe um convidado com este e-mail no evento.");
  }

  const guest: EventGuest = {
    id: crypto.randomUUID(),
    token: crypto.randomBytes(24).toString("hex"),
    name,
    company: (input.company ?? "").trim(),
    email,
    phone: (input.phone ?? "").trim() || undefined,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  event.guests.unshift(guest);
  event.updatedAt = new Date().toISOString();
  await persistEvent(event);

  return guest;
}

export async function deleteGuest(
  eventId: string,
  guestId: string
): Promise<boolean> {
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
  const event = await getEvent(slug);
  const normalizedToken = String(token ?? "").trim();

  if (!event || !normalizedToken) return null;

  const guest = event.guests.find(
    (item) => String(item.token ?? "").trim() === normalizedToken
  );

  return guest ? { event, guest } : null;
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
  const event = await getEvent(slug);
  const guest = event?.guests.find(
    (item) => item.token.trim() === String(token ?? "").trim()
  );

  if (!event || !guest) return null;

  if (input.status === "confirmed") {
    const selectedDate = String(input.selectedDate ?? "").trim();

    if (!selectedDate) {
      throw new Error("Selecione uma data para confirmar a participação.");
    }

    if (!event.dates.some((date) => date.label === selectedDate)) {
      throw new Error("A data selecionada não pertence ao evento.");
    }

    guest.selectedDate = selectedDate;
  } else {
    guest.selectedDate = undefined;
  }

  guest.status = input.status;
  guest.notes = String(input.notes ?? "").trim();
  guest.respondedAt = new Date().toISOString();
  event.updatedAt = guest.respondedAt;

  await persistEvent(event);
  return guest;
}

export async function markSent(
  eventId: string,
  guestIds: string[]
): Promise<void> {
  if (guestIds.length === 0) return;

  const event = await getEvent(eventId);
  if (!event) return;

  const ids = new Set(guestIds);
  const now = new Date().toISOString();

  event.guests.forEach((guest) => {
    if (ids.has(guest.id)) guest.sentAt = now;
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
  if (!event) throw new Error("Evento não encontrado.");

  const result: GuestImportResult = {
    created: [],
    duplicates: [],
    invalid: [],
  };

  const existingByEmail = new Map(
    event.guests.map((guest) => [guest.email.toLowerCase(), guest])
  );
  const seen = new Set<string>();
  const now = new Date().toISOString();

  for (const row of rows) {
    const name = String(row.name ?? "").trim();
    const company = String(row.company ?? "").trim();
    const email = String(row.email ?? "").trim().toLowerCase();
    const phone = String(row.phone ?? "").trim();
    const data = { ...row, name, company, email, phone };

    if (!name) {
      result.invalid.push({
        row: row.row,
        reason: "Nome obrigatório",
        data,
      });
      continue;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      result.invalid.push({
        row: row.row,
        reason: "E-mail inválido",
        data,
      });
      continue;
    }

    if (seen.has(email)) {
      result.invalid.push({
        row: row.row,
        reason: "E-mail duplicado no arquivo",
        data,
      });
      continue;
    }
    seen.add(email);

    const existing = existingByEmail.get(email);
    if (existing) {
      result.duplicates.push(data);

      if (duplicateMode === "update") {
        existing.name = name;
        existing.company = company;
        existing.phone = phone || undefined;
      }
      continue;
    }

    const guest: EventGuest = {
      id: crypto.randomUUID(),
      token: crypto.randomBytes(24).toString("hex"),
      name,
      company,
      email,
      phone: phone || undefined,
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

export type EventHubBackup = {
  format: "eventhub-backup";
  version: 1;
  exportedAt: string;
  events: EventItem[];
};

export async function exportBackup(): Promise<EventHubBackup> {
  return {
    format: "eventhub-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    events: await listEvents(),
  };
}

export async function importBackup(
  value: unknown,
  mode: "merge" | "replace" = "merge"
): Promise<{ imported: number }> {
  const backup = value as Partial<EventHubBackup>;

  if (backup.format !== "eventhub-backup" || backup.version !== 1) {
    throw new Error("Arquivo de backup inválido ou incompatível.");
  }

  if (!Array.isArray(backup.events)) {
    throw new Error("O backup não contém uma lista válida de eventos.");
  }

  await ensureDatabase();
  const sql = database();

  if (mode === "replace") {
    await sql`DELETE FROM eventhub_events`;
  }

  let imported = 0;

  for (const rawEvent of backup.events) {
    const event = normalizeEvent(rawEvent);

    if (!event.id || !event.slug || !event.name) continue;

    await persistEvent(event);
    imported += 1;
  }

  return { imported };
}
