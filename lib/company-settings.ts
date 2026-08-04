import { neon } from "@neondatabase/serverless";

export type EmailProvider = "resend" | "gmail" | "microsoft365" | "smtp";

export type CompanySettings = {
  id: "company";
  legalName: string;
  tradeName: string;
  document: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  logo: string;
  favicon: string;
  loginBanner: string;
  primaryColor: string;
  secondaryColor: string;
  loginTitle: string;
  loginDescription: string;
  footerText: string;
  emailFrom: string;
  emailReplyTo: string;
  emailProvider: EmailProvider;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPasswordEncrypted: string;
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_SETTINGS: CompanySettings = {
  id: "company",
  legalName: "",
  tradeName: "EventHub",
  document: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  logo: "",
  favicon: "",
  loginBanner: "",
  primaryColor: "#173b57",
  secondaryColor: "#d5a44c",
  loginTitle: "Gestão de eventos",
  loginDescription:
    "Acesse para criar eventos, gerenciar convidados e acompanhar confirmações.",
  footerText: "Gestão de eventos",
  emailFrom: process.env.EMAIL_FROM ?? "",
  emailReplyTo: process.env.EMAIL_REPLY_TO ?? "",
  emailProvider: "resend",
  smtpHost: "",
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: "",
  smtpPasswordEncrypted: "",
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

function databaseUrl(): string {
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

function sqlClient() {
  return neon(databaseUrl());
}

let initialized: Promise<void> | null = null;

async function ensureSettingsTable(): Promise<void> {
  if (!initialized) {
    initialized = (async () => {
      const sql = sqlClient();
      await sql`
        CREATE TABLE IF NOT EXISTS eventhub_settings (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
    })().catch((error) => {
      initialized = null;
      throw error;
    });
  }

  await initialized;
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function color(value: unknown, fallback: string): string {
  const normalized = text(value);
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized : fallback;
}

function provider(value: unknown): EmailProvider {
  return value === "gmail" ||
    value === "microsoft365" ||
    value === "smtp"
    ? value
    : "resend";
}

function port(value: unknown): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535
    ? parsed
    : 587;
}

function normalizeSettings(value: unknown): CompanySettings {
  const source = (value ?? {}) as Partial<CompanySettings>;
  const now = new Date().toISOString();

  return {
    ...DEFAULT_SETTINGS,
    ...source,
    id: "company",
    legalName: text(source.legalName),
    tradeName: text(source.tradeName) || DEFAULT_SETTINGS.tradeName,
    document: text(source.document),
    email: text(source.email),
    phone: text(source.phone),
    website: text(source.website),
    address: text(source.address),
    logo: text(source.logo),
    favicon: text(source.favicon),
    loginBanner: text(source.loginBanner),
    primaryColor: color(source.primaryColor, DEFAULT_SETTINGS.primaryColor),
    secondaryColor: color(
      source.secondaryColor,
      DEFAULT_SETTINGS.secondaryColor
    ),
    loginTitle: text(source.loginTitle) || DEFAULT_SETTINGS.loginTitle,
    loginDescription:
      text(source.loginDescription) || DEFAULT_SETTINGS.loginDescription,
    footerText: text(source.footerText) || DEFAULT_SETTINGS.footerText,
    emailFrom: text(source.emailFrom) || process.env.EMAIL_FROM || "",
    emailReplyTo:
      text(source.emailReplyTo) || process.env.EMAIL_REPLY_TO || "",
    emailProvider: provider(source.emailProvider),
    smtpHost: text(source.smtpHost),
    smtpPort: port(source.smtpPort),
    smtpSecure: Boolean(source.smtpSecure),
    smtpUser: text(source.smtpUser),
    smtpPasswordEncrypted: text(source.smtpPasswordEncrypted),
    createdAt: text(source.createdAt) || now,
    updatedAt: text(source.updatedAt) || now,
  };
}

export async function getCompanySettings(): Promise<CompanySettings> {
  await ensureSettingsTable();
  const sql = sqlClient();
  const rows = await sql`
    SELECT data
    FROM eventhub_settings
    WHERE id = 'company'
    LIMIT 1
  `;

  return rows[0]
    ? normalizeSettings(rows[0].data)
    : normalizeSettings(DEFAULT_SETTINGS);
}

export async function saveCompanySettings(
  input: Partial<CompanySettings>
): Promise<CompanySettings> {
  await ensureSettingsTable();
  const sql = sqlClient();
  const current = await getCompanySettings();
  const now = new Date().toISOString();
  const settings = normalizeSettings({
    ...current,
    ...input,
    id: "company",
    createdAt:
      current.createdAt === new Date(0).toISOString()
        ? now
        : current.createdAt,
    updatedAt: now,
  });

  await sql`
    INSERT INTO eventhub_settings (id, data, created_at, updated_at)
    VALUES (
      'company',
      ${JSON.stringify(settings)}::jsonb,
      ${settings.createdAt},
      ${settings.updatedAt}
    )
    ON CONFLICT (id) DO UPDATE SET
      data = EXCLUDED.data,
      updated_at = EXCLUDED.updated_at
  `;

  return settings;
}

export function publicCompanySettings(settings: CompanySettings) {
  const { smtpPasswordEncrypted: _secret, ...publicSettings } = settings;
  return {
    ...publicSettings,
    smtpPasswordConfigured: Boolean(settings.smtpPasswordEncrypted),
  };
}
