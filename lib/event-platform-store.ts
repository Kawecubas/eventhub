import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";
import type { PublicLocale } from "@/lib/public-i18n";

export type EventDate = {
  id: string;
  label: string;
  capacity?: number;
};

export type EventFormFieldType =
  | "content"
  | "short_text"
  | "long_text"
  | "select"
  | "checkbox"
  | "event_dates"
  | "participants"
  | "notes";

export type EventFormField = {
  id: string;
  type: EventFormFieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  visible?: boolean;
  options?: string[];
  maxParticipants?: number;
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
  participants?: number;
  formAnswers?: Record<string, string | boolean | number>;
  sentAt?: string;
  respondedAt?: string;
  createdAt: string;
  source?: "invite" | "public_link";
  locale?: "pt-BR" | "en" | "es" | "it";
  checkinToken?: string;
  checkedIn?: boolean;
  checkedInAt?: string;
};

export type EventItem = {
  id: string;
  slug: string;
  defaultLocale: PublicLocale;
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
  emailHtml?: string;
  status: "draft" | "published" | "closed";
  dates: EventDate[];
  formFields: EventFormField[];
  guests: EventGuest[];
  createdAt: string;
  updatedAt: string;
  publicRegistrationEnabled?: boolean;
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


function defaultFormFields(): EventFormField[] {
  return [
    {
      id: "intro",
      type: "content",
      label: "Confirme sua participação",
      description:
        "Selecione sua resposta e preencha as informações abaixo.",
      visible: true,
    },
    {
      id: "event-date",
      type: "event_dates",
      label: "Escolha uma data",
      required: true,
      visible: true,
    },
    {
      id: "participants",
      type: "participants",
      label: "Quantidade de participantes",
      required: true,
      visible: true,
      maxParticipants: 10,
    },
    {
      id: "notes",
      type: "notes",
      label: "Observações",
      placeholder: "Digite uma observação, se necessário.",
      visible: true,
    },
  ];
}

function normalizeFormField(
  value: Partial<EventFormField>,
  index: number
): EventFormField {
  const allowed: EventFormFieldType[] = [
    "content",
    "short_text",
    "long_text",
    "select",
    "checkbox",
    "event_dates",
    "participants",
    "notes",
  ];

  const type = allowed.includes(value.type as EventFormFieldType)
    ? (value.type as EventFormFieldType)
    : "short_text";

  return {
    id: String(value.id || `field-${index + 1}`),
    type,
    label: String(value.label || "Campo"),
    description: value.description
      ? String(value.description)
      : undefined,
    placeholder: value.placeholder
      ? String(value.placeholder)
      : undefined,
    required: Boolean(value.required),
    visible: value.visible !== false,
    options: Array.isArray(value.options)
      ? value.options.map(String).filter(Boolean)
      : undefined,
    maxParticipants:
      typeof value.maxParticipants === "number"
        ? Math.min(100, Math.max(1, Math.floor(value.maxParticipants)))
        : undefined,
  };
}

function normalizeEvent(value: unknown): EventItem {
  const source = (value ?? {}) as Partial<EventItem>;
  const now = new Date().toISOString();
  const defaultLocale =
    source.defaultLocale === "en" ||
    source.defaultLocale === "es" ||
    source.defaultLocale === "it" ||
    source.defaultLocale === "pt-BR"
      ? source.defaultLocale
      : "pt-BR";

  return {
    id: String(source.id ?? ""),
    slug: normalizeSlug(String(source.slug ?? "")),
    defaultLocale,
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
    emailHtml: source.emailHtml ? String(source.emailHtml) : "",
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
    formFields: Array.isArray(source.formFields)
      ? source.formFields.map((field, index) =>
          normalizeFormField(field, index)
        )
      : defaultFormFields(),
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
          participants:
            typeof guest.participants === "number" && guest.participants >= 1
              ? Math.floor(guest.participants)
              : 1,
          formAnswers:
            guest.formAnswers && typeof guest.formAnswers === "object"
              ? guest.formAnswers
              : {},
          sentAt: guest.sentAt ? String(guest.sentAt) : undefined,
          respondedAt: guest.respondedAt
            ? String(guest.respondedAt)
            : undefined,
          createdAt: String(guest.createdAt ?? now),
          source:
            guest.source === "public_link" || guest.source === "invite"
              ? guest.source
              : undefined,
          locale:
            guest.locale === "en" || guest.locale === "es" || guest.locale === "it" || guest.locale === "pt-BR"
              ? guest.locale
              : undefined,
          checkinToken: guest.checkinToken
            ? String(guest.checkinToken)
            : undefined,
          checkedIn: Boolean(guest.checkedIn),
          checkedInAt: guest.checkedInAt
            ? String(guest.checkedInAt)
            : undefined,
        }))
      : [],
    createdAt: String(source.createdAt ?? now),
    updatedAt: String(source.updatedAt ?? now),
    publicRegistrationEnabled:
      source.publicRegistrationEnabled === false ? false : true,
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
  await ensureDatabase();

  const sql = database();

  const normalizedSlug = decodeURIComponent(slug)
    .trim()
    .toLowerCase();

  const rows = await sql`
    SELECT data
    FROM eventhub_events
    WHERE LOWER(slug) = ${normalizedSlug}
    LIMIT 1
  `;

  return rows[0]
    ? normalizeEvent(rows[0].data)
    : undefined;
}

export async function saveEvent(
  input: Partial<EventItem> & {
    name: string;
    slug: string;
  }
): Promise<EventItem> {
  const now = new Date().toISOString();

  const existing = input.id
    ? await getEvent(input.id)
    : undefined;

  const base: EventItem = existing ?? {
    id: crypto.randomUUID(),
    slug: input.slug,
    defaultLocale: "pt-BR",
    name: input.name,
    description: "",
    location: "",
    startInfo: "",
    primaryColor: "#173b57",
    secondaryColor: "#d5a44c",
    emailFrom:
      process.env.EMAIL_FROM ||
      "Eventos <eventos@seudominio.com>",
    emailSubject: "Convite: {{evento}}",
    emailBody:
      "Olá, {{nome}}. Você está convidado para o evento {{evento}}. Confirme sua participação: {{link}}",
    emailHtml: "",
    status: "draft",
    dates: [],
    formFields: defaultFormFields(),
    guests: [],
    createdAt: now,
    updatedAt: now,
    publicRegistrationEnabled: true,
  };

  const event: EventItem = normalizeEvent({
    ...base,
    ...input,

    id: base.id,
    createdAt: base.createdAt,
    updatedAt: now,

    // Protege os convidados já salvos no banco.
    guests: existing?.guests ?? input.guests ?? [],
  });

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

  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase();

  if (!name) {
    throw new Error("Nome do convidado é obrigatório.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("E-mail inválido.");
  }

  if (
    event.guests.some(
      (guest) => guest.email.trim().toLowerCase() === email
    )
  ) {
    throw new Error("Já existe um convidado com este e-mail no evento.");
  }

  const guest: EventGuest = {
    id: crypto.randomUUID(),
    token: crypto.randomBytes(32).toString("hex"),
    name,
    company: String(input.company ?? "").trim(),
    email,
    phone: String(input.phone ?? "").trim() || undefined,
    status: "pending",
    source: "invite",
    createdAt: new Date().toISOString(),
  };

  // Recarrega o evento imediatamente antes de salvar para evitar que uma
  // edição antiga do formulário sobrescreva convidados recém-adicionados.
  const latestEvent = await getEvent(event.id);
  if (!latestEvent) return null;

  if (
    latestEvent.guests.some(
      (existingGuest) =>
        existingGuest.email.trim().toLowerCase() === email
    )
  ) {
    throw new Error("Já existe um convidado com este e-mail no evento.");
  }

  latestEvent.guests.unshift(guest);
  latestEvent.updatedAt = new Date().toISOString();

  await persistEvent(latestEvent);

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
): Promise<{
  event: EventItem;
  guest: EventGuest;
} | null> {
  const normalizedSlug = normalizeSlug(decodeURIComponent(slug));
  const normalizedToken = decodeURIComponent(token).trim();

  const event = await getEventBySlug(normalizedSlug);

  const findGuestInEvent = (
    currentEvent: EventItem
  ): EventGuest | undefined =>
    currentEvent.guests.find(
      (item) =>
        String(item.token ?? "").trim() === normalizedToken
    );

  const fallbackByToken = async () => {
    const events = await listEvents();

    for (const currentEvent of events) {
      const matchedGuest = findGuestInEvent(currentEvent);

      if (matchedGuest) {
        console.warn("[FIND GUEST] Token encontrado em outro evento:", {
          requestedSlug: normalizedSlug,
          matchedEventId: currentEvent.id,
          matchedSlug: currentEvent.slug,
        });

        return {
          event: currentEvent,
          guest: matchedGuest,
        };
      }
    }

    return null;
  };

  if (!event) {
    console.error("[FIND GUEST] Evento não encontrado:", {
      slug: normalizedSlug,
    });

    return fallbackByToken();
  }

  const guest = findGuestInEvent(event);

  if (!guest) {
    console.error("[FIND GUEST] Token não encontrado:", {
      eventId: event.id,
      slug: event.slug,
      receivedToken: normalizedToken,
      guestCount: event.guests.length,
    });

    return fallbackByToken();
  }

  return {
    event,
    guest,
  };
}

export async function respond(
  slug: string,
  token: string,
  input: {
    status: "confirmed" | "declined";
    selectedDate?: string;
    notes?: string;
    participants?: number;
    locale?: "pt-BR" | "en" | "es" | "it";
    formAnswers?: Record<string, string | boolean | number>;
  }
): Promise<EventGuest | null> {
  const result = await findGuest(slug, token);
  const event = result?.event;
  const guest = result?.guest;

  if (!event || !guest) {
    return null;
  }

  if (guest.respondedAt) {
    throw new Error("Este convite já foi respondido.");
  }

  if (input.status === "confirmed") {
    const selectedDate = String(input.selectedDate ?? "").trim();
    const participants = Math.min(
      10,
      Math.max(1, Math.floor(Number(input.participants) || 1))
    );

    if (!selectedDate) {
      throw new Error("Selecione uma data para confirmar a participação.");
    }

    const eventDate = event.dates.find((date) => date.label === selectedDate);

    if (!eventDate) {
      throw new Error("A data selecionada não pertence ao evento.");
    }

    if (typeof eventDate.capacity === "number") {
      const occupied = event.guests
        .filter(
          (item) =>
            item.id !== guest.id &&
            item.status === "confirmed" &&
            item.selectedDate === selectedDate
        )
        .reduce((sum, item) => sum + (item.participants || 1), 0);

      if (occupied + participants > eventDate.capacity) {
        throw new Error(
          `A data selecionada possui apenas ${Math.max(
            eventDate.capacity - occupied,
            0
          )} vaga(s) disponível(is).`
        );
      }
    }

    guest.selectedDate = selectedDate;
    guest.participants = participants;
  } else {
    guest.selectedDate = undefined;
    guest.participants = 1;
  }

  guest.status = input.status;
  if (input.locale) guest.locale = input.locale;
  if (input.status === "confirmed" && !guest.checkinToken) {
    guest.checkinToken = crypto.randomBytes(16).toString("hex");
  }
  guest.notes = String(input.notes ?? "").trim();
  guest.formAnswers =
    input.formAnswers && typeof input.formAnswers === "object"
      ? input.formAnswers
      : {};
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
      token: crypto.randomBytes(32).toString("hex"),
      name,
      company,
      email,
      phone: phone || undefined,
      status: "pending",
      source: "invite",
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

/**
 * Cria um convidado a partir do link público (sem convite prévio).
 * Usado quando alguém clica no link compartilhado em redes sociais.
 */
export async function registerPublicGuest(
  slugOrId: string,
  input: {
    name: string;
    company?: string;
    email: string;
    phone?: string;
    selectedDate?: string;
    participants?: number;
    notes?: string;
    locale?: "pt-BR" | "en" | "es" | "it";
    formAnswers?: Record<string, string | boolean | number>;
  }
): Promise<{ event: EventItem; guest: EventGuest } | null> {
  const event = await getEvent(slugOrId);
  if (!event) return null;

  if (event.publicRegistrationEnabled === false) {
    throw new Error(
      "As inscrições públicas para este evento estão desativadas."
    );
  }

  if (event.status === "closed") {
    throw new Error("As inscrições para este evento estão encerradas.");
  }

  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase();

  if (!name) {
    throw new Error("Nome é obrigatório.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("E-mail inválido.");
  }

  // Recarrega o evento mais recente para evitar condição de corrida
  const latestEvent = await getEvent(event.id);
  if (!latestEvent) return null;

  const existing = latestEvent.guests.find(
    (guest) => guest.email.trim().toLowerCase() === email
  );

  if (existing) {
    // Se já existe (ex: reenviou o formulário), retorna o mesmo registro
    // ao invés de duplicar — evita QR Codes conflitantes.
    return { event: latestEvent, guest: existing };
  }

  let selectedDate: string | undefined;
  const participants = Math.min(
    10,
    Math.max(1, Math.floor(Number(input.participants) || 1))
  );

  if (input.selectedDate) {
    selectedDate = String(input.selectedDate).trim();
    const eventDate = latestEvent.dates.find(
      (date) => date.label === selectedDate
    );

    if (!eventDate) {
      throw new Error("A data selecionada não pertence ao evento.");
    }

    if (typeof eventDate.capacity === "number") {
      const occupied = latestEvent.guests
        .filter(
          (item) =>
            item.status === "confirmed" && item.selectedDate === selectedDate
        )
        .reduce((sum, item) => sum + (item.participants || 1), 0);

      if (occupied + participants > eventDate.capacity) {
        throw new Error(
          `Vagas esgotadas para esta data. Restam ${Math.max(
            eventDate.capacity - occupied,
            0
          )} vaga(s).`
        );
      }
    }
  }

  const now = new Date().toISOString();

  const guest: EventGuest = {
    id: crypto.randomUUID(),
    token: crypto.randomBytes(32).toString("hex"),
    checkinToken: crypto.randomBytes(16).toString("hex"),
    name,
    company: String(input.company ?? "").trim(),
    email,
    phone: String(input.phone ?? "").trim() || undefined,
    status: "confirmed",
    selectedDate,
    participants,
    notes: String(input.notes ?? "").trim() || undefined,
    formAnswers:
      input.formAnswers && typeof input.formAnswers === "object"
        ? input.formAnswers
        : {},
    source: "public_link",
    locale: input.locale,
    respondedAt: now,
    checkedIn: false,
    createdAt: now,
  };

  latestEvent.guests.unshift(guest);
  latestEvent.updatedAt = now;

  await persistEvent(latestEvent);

  return { event: latestEvent, guest };
}

/**
 * Confirma a presença física do convidado via leitura de QR Code.
 */
export async function checkinGuestByToken(
  eventId: string,
  checkinToken: string
): Promise<{ guest: EventGuest; alreadyCheckedIn: boolean } | null> {
  const event = await getEvent(eventId);
  if (!event) return null;

  const normalizedToken = String(checkinToken ?? "").trim();

  const guest = event.guests.find(
    (item) => String(item.checkinToken ?? "").trim() === normalizedToken
  );

  if (!guest) return null;

  if (guest.checkedIn) {
    return { guest, alreadyCheckedIn: true };
  }

  guest.checkedIn = true;
  guest.checkedInAt = new Date().toISOString();
  event.updatedAt = guest.checkedInAt;

  await persistEvent(event);

  return { guest, alreadyCheckedIn: false };
}

/**
 * Busca um convidado pelo checkinToken, sem alterar o status.
 * Útil para o scanner mostrar os dados antes de confirmar.
 */
export async function findGuestByCheckinToken(
  eventId: string,
  checkinToken: string
): Promise<EventGuest | null> {
  const event = await getEvent(eventId);
  if (!event) return null;

  const normalizedToken = String(checkinToken ?? "").trim();

  return (
    event.guests.find(
      (item) => String(item.checkinToken ?? "").trim() === normalizedToken
    ) ?? null
  );
}
