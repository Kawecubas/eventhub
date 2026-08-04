import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";

export type SystemEmailTemplateType =
  | "invitation"
  | "reminder"
  | "confirmation"
  | "declined"
  | "thank-you"
  | "custom";

export type SystemEmailTemplate = {
  id: string;
  name: string;
  description: string;
  type: SystemEmailTemplateType;
  subject: string;
  html: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

function getDatabaseUrl(): string {
  const value =
    process.env.DATABASE_URL ||
    process.env.event_hub_POSTGRES_URL ||
    process.env.event_hub_DATABASE_URL_UNPOOLED ||
    process.env.event_hub_POSTGRES_URL_NON_POOLING ||
    process.env.eventhub_POSTGRES_URL ||
    process.env.eventhub_POSTGRES_PRISMA_URL;

  if (!value) {
    throw new Error("Banco não configurado. Defina DATABASE_URL.");
  }

  return value.trim();
}

function database() {
  return neon(getDatabaseUrl());
}

let initialized: Promise<void> | null = null;

async function ensureTable(): Promise<void> {
  if (!initialized) {
    initialized = (async () => {
      const sql = database();

      await sql`
        CREATE TABLE IF NOT EXISTS eventhub_email_templates (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          type TEXT NOT NULL,
          subject TEXT NOT NULL,
          html TEXT NOT NULL,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS eventhub_email_templates_updated_idx
        ON eventhub_email_templates (updated_at DESC)
      `;
    })().catch((error) => {
      initialized = null;
      throw error;
    });
  }

  await initialized;
}

function normalizeType(value: unknown): SystemEmailTemplateType {
  const allowed: SystemEmailTemplateType[] = [
    "invitation",
    "reminder",
    "confirmation",
    "declined",
    "thank-you",
    "custom",
  ];

  return allowed.includes(value as SystemEmailTemplateType)
    ? (value as SystemEmailTemplateType)
    : "custom";
}

function normalizeTemplate(value: any): SystemEmailTemplate {
  const now = new Date().toISOString();

  return {
    id: String(value?.id || crypto.randomUUID()),
    name: String(value?.name || "Novo template").trim(),
    description: String(value?.description || "").trim(),
    type: normalizeType(value?.type),
    subject: String(value?.subject || "Mensagem sobre {{evento}}"),
    html: String(value?.html || ""),
    active: value?.active !== false,
    createdAt: String(value?.createdAt || value?.created_at || now),
    updatedAt: String(value?.updatedAt || value?.updated_at || now),
  };
}

export async function listSystemEmailTemplates(): Promise<SystemEmailTemplate[]> {
  await ensureTable();
  const sql = database();

  const rows = await sql`
    SELECT
      id,
      name,
      description,
      type,
      subject,
      html,
      active,
      created_at,
      updated_at
    FROM eventhub_email_templates
    ORDER BY updated_at DESC
  `;

  return rows.map(normalizeTemplate);
}

export async function getSystemEmailTemplate(
  id: string
): Promise<SystemEmailTemplate | null> {
  await ensureTable();
  const sql = database();

  const rows = await sql`
    SELECT
      id,
      name,
      description,
      type,
      subject,
      html,
      active,
      created_at,
      updated_at
    FROM eventhub_email_templates
    WHERE id = ${id}
    LIMIT 1
  `;

  return rows[0] ? normalizeTemplate(rows[0]) : null;
}

export async function saveSystemEmailTemplate(
  input: Partial<SystemEmailTemplate>
): Promise<SystemEmailTemplate> {
  await ensureTable();

  const current = input.id
    ? await getSystemEmailTemplate(input.id)
    : null;

  const now = new Date().toISOString();

  const template = normalizeTemplate({
    ...current,
    ...input,
    id: current?.id || input.id || crypto.randomUUID(),
    createdAt: current?.createdAt || now,
    updatedAt: now,
  });

  if (!template.name) {
    throw new Error("Nome do template é obrigatório.");
  }

  if (!template.subject) {
    throw new Error("Assunto do template é obrigatório.");
  }

  if (!template.html) {
    throw new Error("HTML do template é obrigatório.");
  }

  const sql = database();

  await sql`
    INSERT INTO eventhub_email_templates (
      id,
      name,
      description,
      type,
      subject,
      html,
      active,
      created_at,
      updated_at
    )
    VALUES (
      ${template.id},
      ${template.name},
      ${template.description},
      ${template.type},
      ${template.subject},
      ${template.html},
      ${template.active},
      ${template.createdAt},
      ${template.updatedAt}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      type = EXCLUDED.type,
      subject = EXCLUDED.subject,
      html = EXCLUDED.html,
      active = EXCLUDED.active,
      updated_at = EXCLUDED.updated_at
  `;

  return template;
}

export async function deleteSystemEmailTemplate(
  id: string
): Promise<boolean> {
  await ensureTable();
  const sql = database();

  const rows = await sql`
    DELETE FROM eventhub_email_templates
    WHERE id = ${id}
    RETURNING id
  `;

  return rows.length > 0;
}
