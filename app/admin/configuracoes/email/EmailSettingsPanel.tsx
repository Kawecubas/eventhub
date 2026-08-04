"use client";

import { useState, type FormEvent } from "react";

import type { CompanySettings, EmailProvider } from "@/lib/company-settings";

export type PublicEmailSettings = Omit<
  CompanySettings,
  "smtpPasswordEncrypted"
> & {
  smtpPasswordConfigured: boolean;
};

export default function EmailSettingsPanel({
  initial,
}: {
  initial: PublicEmailSettings;
}) {
  const [form, setForm] = useState(initial);
  const [password, setPassword] = useState("");
  const [testEmail, setTestEmail] = useState(initial.email || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSmtp = form.emailProvider !== "resend";
  const isCustom = form.emailProvider === "smtp";

  function update<K extends keyof PublicEmailSettings>(
    key: K,
    value: PublicEmailSettings[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/configuracoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, smtpPassword: password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao salvar.");

      setForm(result);
      setPassword("");
      setMessage("Configurações de e-mail salvas.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  async function testConnection() {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/configuracoes/email/testar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha no teste.");
      setMessage(result.message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha no teste.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="email-settings" onSubmit={save}>
      <header>
        <div>
          <small>COMUNICAÇÃO</small>
          <h1>Servidor de e-mail</h1>
          <p>Configure Resend, Gmail, Microsoft 365 ou outro SMTP.</p>
        </div>
      </header>

      <section className="email-settings-card">
        <label>
          Provedor
          <select
            value={form.emailProvider}
            onChange={(event) =>
              update("emailProvider", event.target.value as EmailProvider)
            }
          >
            <option value="resend">Resend</option>
            <option value="gmail">Gmail pessoal / Google Workspace</option>
            <option value="microsoft365">Microsoft 365 / Outlook</option>
            <option value="smtp">SMTP personalizado</option>
          </select>
        </label>

        <label>
          Remetente
          <input
            value={form.emailFrom}
            onChange={(event) => update("emailFrom", event.target.value)}
            placeholder="Gambini <seuemail@gmail.com>"
          />
        </label>

        <label>
          Responder para
          <input
            type="email"
            value={form.emailReplyTo}
            onChange={(event) => update("emailReplyTo", event.target.value)}
          />
        </label>

        {isSmtp && (
          <>
            {isCustom && (
              <>
                <label>
                  Servidor SMTP
                  <input
                    value={form.smtpHost}
                    onChange={(event) => update("smtpHost", event.target.value)}
                    placeholder="smtp.exemplo.com"
                  />
                </label>
                <label>
                  Porta
                  <input
                    type="number"
                    value={form.smtpPort}
                    onChange={(event) =>
                      update("smtpPort", Number(event.target.value))
                    }
                  />
                </label>
                <label className="email-checkbox">
                  <input
                    type="checkbox"
                    checked={form.smtpSecure}
                    onChange={(event) =>
                      update("smtpSecure", event.target.checked)
                    }
                  />
                  SSL direto (normalmente porta 465)
                </label>
              </>
            )}

            <label>
              Usuário SMTP
              <input
                type="email"
                value={form.smtpUser}
                onChange={(event) => update("smtpUser", event.target.value)}
                placeholder="seuemail@gmail.com"
              />
            </label>

            <label>
              {form.emailProvider === "gmail" ? "Senha de app" : "Senha SMTP"}
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={
                  form.smtpPasswordConfigured
                    ? "Credencial já cadastrada — deixe vazio para manter"
                    : "Informe a credencial"
                }
                autoComplete="new-password"
              />
            </label>
          </>
        )}

        <div className="email-actions">
          <button disabled={loading} type="submit">
            {loading ? "Processando..." : "Salvar configuração"}
          </button>
        </div>
      </section>

      <section className="email-settings-card">
        <h2>Enviar teste</h2>
        <label>
          Destinatário
          <input
            type="email"
            value={testEmail}
            onChange={(event) => setTestEmail(event.target.value)}
          />
        </label>
        <button disabled={loading} type="button" onClick={testConnection}>
          Enviar e-mail de teste
        </button>
      </section>

      {message && <div className="email-success">{message}</div>}
      {error && <div className="email-error">{error}</div>}
    </form>
  );
}
