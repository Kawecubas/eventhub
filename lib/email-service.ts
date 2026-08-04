import nodemailer from "nodemailer";

import type { CompanySettings } from "@/lib/company-settings";
import { decryptSecret } from "@/lib/secret-crypto";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

function parseFrom(value: string, fallbackEmail: string) {
  const normalized = value.trim();
  const match = normalized.match(/^(.+?)\s*<([^>]+)>$/);

  if (match) {
    return {
      name: match[1].trim().replace(/^"|"$/g, ""),
      address: match[2].trim(),
    };
  }

  return {
    name: "EventHub",
    address: normalized || fallbackEmail,
  };
}

function smtpPreset(settings: CompanySettings) {
  if (settings.emailProvider === "gmail") {
    return { host: "smtp.gmail.com", port: 587, secure: false };
  }

  if (settings.emailProvider === "microsoft365") {
    return { host: "smtp.office365.com", port: 587, secure: false };
  }

  return {
    host: settings.smtpHost,
    port: settings.smtpPort || 587,
    secure: settings.smtpSecure,
  };
}

async function sendWithSmtp(
  settings: CompanySettings,
  input: SendEmailInput
) {
  const preset = smtpPreset(settings);
  const password = settings.smtpPasswordEncrypted
    ? decryptSecret(settings.smtpPasswordEncrypted)
    : process.env.SMTP_PASSWORD?.trim() || "";
  const user = settings.smtpUser || process.env.SMTP_USER?.trim() || "";

  if (!preset.host || !user || !password) {
    throw new Error(
      "Configuração SMTP incompleta. Informe servidor, usuário e senha de app."
    );
  }

  const transporter = nodemailer.createTransport({
    host: preset.host,
    port: preset.port,
    secure: preset.secure,
    requireTLS: !preset.secure,
    auth: { user, pass: password },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });

  await transporter.verify();

  const from = parseFrom(settings.emailFrom, user);

  return transporter.sendMail({
    from,
    to: Array.isArray(input.to) ? input.to.join(",") : input.to,
    replyTo: settings.emailReplyTo || undefined,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}

async function sendWithResend(
  settings: CompanySettings,
  input: SendEmailInput
) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error("RESEND_API_KEY não configurada.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: settings.emailFrom,
      to: Array.isArray(input.to) ? input.to : [input.to],
      reply_to: settings.emailReplyTo || undefined,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      result?.message || result?.error || "Falha no envio pelo Resend."
    );
  }

  return result;
}

export async function sendEmail(
  settings: CompanySettings,
  input: SendEmailInput
) {
  if (settings.emailProvider === "resend") {
    return sendWithResend(settings, input);
  }

  return sendWithSmtp(settings, input);
}
