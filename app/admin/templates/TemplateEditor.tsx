"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  SystemEmailTemplate,
  SystemEmailTemplateType,
} from "@/lib/email-template-store";

type Props = {
  initial?: SystemEmailTemplate | null;
};

const DEFAULT_HTML = `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table width="620" cellpadding="0" cellspacing="0" role="presentation"
            style="width:100%;max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:36px;">
                <p style="margin:0 0 12px;color:#667085;font-size:13px;">CONVITE ESPECIAL</p>
                <h1 style="margin:0 0 20px;color:#17212b;">{{evento}}</h1>
                <p style="color:#344054;line-height:1.6;">Olá, <strong>{{nome}}</strong>.</p>
                <p style="color:#344054;line-height:1.6;">
                  Você está convidado para participar do evento {{evento}}.
                </p>
                <p style="margin:28px 0;">
                  <a href="{{link}}"
                    style="display:inline-block;padding:14px 24px;background:#173b57;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">
                    Confirmar participação
                  </a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;background:#0f2940;color:#ffffff;text-align:center;font-size:12px;">
                Gestão de eventos
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export default function TemplateEditor({ initial }: Props) {
  const router = useRouter();

  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [type, setType] = useState<SystemEmailTemplateType>(
    initial?.type || "invitation"
  );
  const [subject, setSubject] = useState(
    initial?.subject || "Convite: {{evento}}"
  );
  const [html, setHtml] = useState(initial?.html || DEFAULT_HTML);
  const [active, setActive] = useState(initial?.active !== false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop"
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const preview = useMemo(
    () =>
      html
        .replaceAll("{{nome}}", "Kawe Croce Cubas")
        .replaceAll("{{empresa}}", "KG Consulting")
        .replaceAll("{{evento}}", "Evento de demonstração")
        .replaceAll(
          "{{link}}",
          "https://exemplo.com/eventos/demo?token=preview"
        )
        .replaceAll("{{data}}", "20/08/2026")
        .replaceAll("{{local}}", "Joinville/SC"),
    [html]
  );

  function insertVariable(variable: string) {
    setHtml((current) => `${current}\n${variable}`);
  }

  async function save() {
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const endpoint = initial?.id
        ? `/api/email-templates/${encodeURIComponent(initial.id)}`
        : "/api/email-templates";

      const response = await fetch(endpoint, {
        method: initial?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          type,
          subject,
          html,
          active,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Falha ao salvar template.");
      }

      setMessage("Template salvo com sucesso.");

      if (!initial?.id && result.id) {
        router.replace(`/admin/templates/${result.id}`);
      }

      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Falha ao salvar template."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="system-template-editor">
      <header className="system-template-header">
        <div>
          <small>COMUNICAÇÃO / TEMPLATE</small>
          <h1>{initial ? "Editar template" : "Novo template"}</h1>
        </div>

        <button type="button" onClick={save} disabled={busy}>
          {busy ? "Salvando..." : "Salvar template"}
        </button>
      </header>

      <div className="system-template-grid">
        <section className="system-template-controls">
          <label>
            Nome
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>

          <label>
            Descrição
            <textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <label>
            Tipo
            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value as SystemEmailTemplateType)
              }
            >
              <option value="invitation">Convite</option>
              <option value="reminder">Lembrete</option>
              <option value="confirmation">Confirmação</option>
              <option value="declined">Recusa</option>
              <option value="thank-you">Agradecimento</option>
              <option value="custom">Personalizado</option>
            </select>
          </label>

          <label>
            Assunto
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </label>

          <div className="template-variables">
            <span>Inserir variável</span>

            {[
              "{{nome}}",
              "{{empresa}}",
              "{{evento}}",
              "{{data}}",
              "{{local}}",
              "{{link}}",
            ].map((variable) => (
              <button
                type="button"
                key={variable}
                onClick={() => insertVariable(variable)}
              >
                {variable}
              </button>
            ))}
          </div>

          <label>
            HTML
            <textarea
              className="html-editor"
              rows={28}
              value={html}
              onChange={(event) => setHtml(event.target.value)}
              spellCheck={false}
            />
          </label>

          <label className="template-checkbox">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
            Template ativo
          </label>

          {message && <div className="template-success">{message}</div>}
          {error && <div className="template-error">{error}</div>}
        </section>

        <section className="system-template-preview">
          <div className="template-preview-toolbar">
            <strong>Pré-visualização</strong>
            <div>
              <button
                type="button"
                className={previewMode === "desktop" ? "selected" : ""}
                onClick={() => setPreviewMode("desktop")}
              >
                Desktop
              </button>
              <button
                type="button"
                className={previewMode === "mobile" ? "selected" : ""}
                onClick={() => setPreviewMode("mobile")}
              >
                Mobile
              </button>
            </div>
          </div>

          <iframe
            title="Pré-visualização do template"
            className={previewMode}
            srcDoc={preview}
            sandbox=""
          />
        </section>
      </div>
    </main>
  );
}
