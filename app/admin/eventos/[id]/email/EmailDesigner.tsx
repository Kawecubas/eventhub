"use client";

import { useMemo, useState, type ChangeEvent } from "react";

import type { EventItem } from "@/lib/event-platform-store";
import {
  buildVisualEmailHtml,
  replaceEmailVariables,
} from "@/lib/email-template-builder";

type Props = {
  event: EventItem;
};

const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

export default function EmailDesigner({ event }: Props) {
  const [assetUrl, setAssetUrl] = useState(event.banner ?? "");
  const [localPreview, setLocalPreview] = useState("");

  const [subject, setSubject] = useState(
    event.emailSubject || `Convite: ${event.name}`
  );
  const [heading, setHeading] = useState(event.name);
  const [preheader, setPreheader] = useState(
    `Convite especial para ${event.name}`
  );
  const [body, setBody] = useState(
    event.emailBody ||
      "Você está convidado para participar deste evento. Escolha uma data e confirme sua participação."
  );
  const [ctaLabel, setCtaLabel] = useState(
    "Confirmar participação"
  );
  const [altText, setAltText] = useState(
    `Convite visual do evento ${event.name}`
  );
  const [primaryColor, setPrimaryColor] = useState(
    event.primaryColor || "#173b57"
  );
  const [backgroundColor, setBackgroundColor] =
    useState("#f3f6f9");
  const [showGreeting, setShowGreeting] = useState(true);

  const [footerLogo, setFooterLogo] = useState(
    event.logo || ""
  );
  const [footerTitle, setFooterTitle] = useState(
    event.name || "Gestão de eventos"
  );
  const [footerText, setFooterText] = useState(
    "Este e-mail foi enviado automaticamente pelo sistema de gestão de eventos."
  );
  const [footerAddress, setFooterAddress] = useState(
    event.location || ""
  );
  const [footerPhone, setFooterPhone] = useState("");
  const [footerEmail, setFooterEmail] = useState("");
  const [footerWebsite, setFooterWebsite] = useState("");
  const [footerInstagram, setFooterInstagram] = useState("");
  const [footerLinkedin, setFooterLinkedin] = useState("");
  const [footerFacebook, setFooterFacebook] = useState("");
  const [footerBackground, setFooterBackground] =
    useState("#0f2940");
  const [footerColor, setFooterColor] = useState("#ffffff");
  const [showFooterLogo, setShowFooterLogo] = useState(true);
  const [showFooterContact, setShowFooterContact] =
    useState(true);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const visualUrl = assetUrl || localPreview;

  const html = useMemo(
    () =>
      buildVisualEmailHtml({
        assetUrl:
          visualUrl ||
          "https://placehold.co/640x700/png?text=Envie+sua+imagem",
        altText,
        preheader,
        heading,
        body,
        ctaLabel,
        primaryColor,
        backgroundColor,
        showGreeting,
        footerLogo,
        footerTitle,
        footerText,
        footerAddress,
        footerPhone,
        footerEmail,
        footerWebsite,
        footerInstagram,
        footerLinkedin,
        footerFacebook,
        footerBackground,
        footerColor,
        showFooterLogo,
        showFooterContact,
      }),
    [
      visualUrl,
      altText,
      preheader,
      heading,
      body,
      ctaLabel,
      primaryColor,
      backgroundColor,
      showGreeting,
      footerLogo,
      footerTitle,
      footerText,
      footerAddress,
      footerPhone,
      footerEmail,
      footerWebsite,
      footerInstagram,
      footerLinkedin,
      footerFacebook,
      footerBackground,
      footerColor,
      showFooterLogo,
      showFooterContact,
    ]
  );

  const previewHtml = useMemo(
    () =>
      replaceEmailVariables(html, {
        nome: "Kawe Croce Cubas",
        empresa: "KG Consulting",
        evento: event.name,
        link: "https://exemplo.com/confirmar?token=preview",
      }),
    [html, event.name]
  );

  async function uploadImage(
    file: File,
    target: "main" | "footer"
  ) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      throw new Error("Envie uma imagem PNG, JPG ou WEBP.");
    }

    if (file.size <= 0) {
      throw new Error("O arquivo selecionado está vazio.");
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error("A imagem deve possuir no máximo 8 MB.");
    }

    const form = new FormData();
    form.append("file", file);

    const response = await fetch("/api/email-assets/upload", {
      method: "POST",
      body: form,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.error || "Falha no upload da imagem."
      );
    }

    if (!result.url) {
      throw new Error("A API não retornou a URL da imagem.");
    }

    const url = String(result.url);

    if (target === "main") {
      setAssetUrl(url);
    } else {
      setFooterLogo(url);
    }

    return url;
  }

  async function onMainImage(
    eventInput: ChangeEvent<HTMLInputElement>
  ) {
    const selected = eventInput.target.files?.[0];

    if (!selected) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      if (!ALLOWED_IMAGE_TYPES.has(selected.type)) {
        throw new Error("Envie uma imagem PNG, JPG ou WEBP.");
      }

      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }

      setLocalPreview(URL.createObjectURL(selected));
      await uploadImage(selected, "main");

      setMessage(
        "Imagem principal enviada. Revise a prévia e salve o template."
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Falha ao processar a imagem."
      );
    } finally {
      setBusy(false);
      eventInput.target.value = "";
    }
  }

  async function onFooterLogo(
    eventInput: ChangeEvent<HTMLInputElement>
  ) {
    const selected = eventInput.target.files?.[0];

    if (!selected) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await uploadImage(selected, "footer");
      setShowFooterLogo(true);
      setMessage("Logo do rodapé enviada com sucesso.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Falha ao enviar a logo do rodapé."
      );
    } finally {
      setBusy(false);
      eventInput.target.value = "";
    }
  }

  async function saveTemplate() {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      if (!assetUrl) {
        throw new Error(
          "Envie uma imagem principal antes de salvar."
        );
      }

      const response = await fetch(
        `/api/eventos/${encodeURIComponent(
          event.id
        )}/email-template`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assetUrl,
            subject,
            heading,
            preheader,
            body,
            ctaLabel,
            altText,
            primaryColor,
            backgroundColor,
            showGreeting,
            footerLogo,
            footerTitle,
            footerText,
            footerAddress,
            footerPhone,
            footerEmail,
            footerWebsite,
            footerInstagram,
            footerLinkedin,
            footerFacebook,
            footerBackground,
            footerColor,
            showFooterLogo,
            showFooterContact,
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error || "Falha ao salvar o template."
        );
      }

      setMessage(
        "Template HTML salvo no evento com sucesso."
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Falha ao salvar o template."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="email-designer-page">
      <header className="email-designer-header">
        <div>
          <small>EVENTO / MODELO DE E-MAIL</small>
          <h1>{event.name}</h1>
          <p>
            Personalize a arte, o conteúdo e o rodapé do
            e-mail.
          </p>
        </div>

        <button
          type="button"
          onClick={saveTemplate}
          disabled={busy || !assetUrl}
        >
          {busy ? "Processando..." : "Salvar template"}
        </button>
      </header>

      <div className="email-designer-grid">
        <section className="email-designer-controls">
          <article className="designer-card">
            <h2>1. Arte principal</h2>

            <label className="upload-box">
              <strong>
                {busy
                  ? "Processando imagem..."
                  : "Selecionar imagem"}
              </strong>

              <span>
                PNG, JPG ou WEBP. Tamanho máximo de 8 MB.
              </span>

              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                onChange={onMainImage}
                disabled={busy}
              />
            </label>

            {visualUrl && (
              <img
                className="asset-miniature"
                src={visualUrl}
                alt="Prévia da arte principal"
              />
            )}
          </article>

          <article className="designer-card form-fields">
            <h2>2. Conteúdo</h2>

            <label>
              Assunto
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </label>

            <label>
              Preheader
              <input
                value={preheader}
                onChange={(e) =>
                  setPreheader(e.target.value)
                }
              />
            </label>

            <label>
              Título
              <input
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
              />
            </label>

            <label>
              Texto
              <textarea
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </label>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={showGreeting}
                onChange={(e) =>
                  setShowGreeting(e.target.checked)
                }
              />
              Exibir saudação automática “Olá, nome”
            </label>

            <label>
              Texto do botão
              <input
                value={ctaLabel}
                onChange={(e) =>
                  setCtaLabel(e.target.value)
                }
              />
            </label>

            <label>
              Descrição da arte
              <input
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
              />
            </label>

            <div className="color-row">
              <label>
                Cor do botão
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) =>
                    setPrimaryColor(e.target.value)
                  }
                />
              </label>

              <label>
                Fundo do e-mail
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) =>
                    setBackgroundColor(e.target.value)
                  }
                />
              </label>
            </div>
          </article>

          <article className="designer-card form-fields footer-designer">
            <h2>3. Rodapé</h2>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={showFooterLogo}
                onChange={(e) =>
                  setShowFooterLogo(e.target.checked)
                }
              />
              Exibir logo no rodapé
            </label>

            <label className="upload-box footer-upload">
              <strong>Enviar logo do rodapé</strong>
              <span>PNG, JPG ou WEBP.</span>

              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                onChange={onFooterLogo}
                disabled={busy}
              />
            </label>

            <label>
              URL da logo
              <input
                value={footerLogo}
                onChange={(e) =>
                  setFooterLogo(e.target.value)
                }
                placeholder="https://..."
              />
            </label>

            {footerLogo && showFooterLogo && (
              <img
                className="footer-logo-preview"
                src={footerLogo}
                alt="Logo do rodapé"
              />
            )}

            <label>
              Título do rodapé
              <input
                value={footerTitle}
                onChange={(e) =>
                  setFooterTitle(e.target.value)
                }
              />
            </label>

            <label>
              Texto institucional
              <textarea
                rows={4}
                value={footerText}
                onChange={(e) =>
                  setFooterText(e.target.value)
                }
              />
            </label>

            <label>
              Endereço
              <input
                value={footerAddress}
                onChange={(e) =>
                  setFooterAddress(e.target.value)
                }
              />
            </label>

            <div className="footer-contact-grid">
              <label>
                Telefone
                <input
                  value={footerPhone}
                  onChange={(e) =>
                    setFooterPhone(e.target.value)
                  }
                />
              </label>

              <label>
                E-mail
                <input
                  type="email"
                  value={footerEmail}
                  onChange={(e) =>
                    setFooterEmail(e.target.value)
                  }
                />
              </label>
            </div>

            <label>
              Website
              <input
                value={footerWebsite}
                onChange={(e) =>
                  setFooterWebsite(e.target.value)
                }
                placeholder="https://..."
              />
            </label>

            <label>
              Instagram
              <input
                value={footerInstagram}
                onChange={(e) =>
                  setFooterInstagram(e.target.value)
                }
                placeholder="https://instagram.com/..."
              />
            </label>

            <label>
              LinkedIn
              <input
                value={footerLinkedin}
                onChange={(e) =>
                  setFooterLinkedin(e.target.value)
                }
                placeholder="https://linkedin.com/company/..."
              />
            </label>

            <label>
              Facebook
              <input
                value={footerFacebook}
                onChange={(e) =>
                  setFooterFacebook(e.target.value)
                }
                placeholder="https://facebook.com/..."
              />
            </label>

            <div className="color-row">
              <label>
                Fundo do rodapé
                <input
                  type="color"
                  value={footerBackground}
                  onChange={(e) =>
                    setFooterBackground(e.target.value)
                  }
                />
              </label>

              <label>
                Cor do texto
                <input
                  type="color"
                  value={footerColor}
                  onChange={(e) =>
                    setFooterColor(e.target.value)
                  }
                />
              </label>
            </div>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={showFooterContact}
                onChange={(e) =>
                  setShowFooterContact(e.target.checked)
                }
              />
              Exibir contatos e redes sociais
            </label>
          </article>

          <p className="variables">
            Variáveis disponíveis: <code>{"{{nome}}"}</code>,{" "}
            <code>{"{{empresa}}"}</code>,{" "}
            <code>{"{{evento}}"}</code> e{" "}
            <code>{"{{link}}"}</code>.
          </p>

          {message && (
            <div className="designer-message success-message">
              {message}
            </div>
          )}

          {error && (
            <div className="designer-message error-message">
              {error}
            </div>
          )}
        </section>

        <section className="email-preview-panel">
          <div className="preview-toolbar">
            <strong>Pré-visualização</strong>
            <span>640 px</span>
          </div>

          <iframe
            title="Pré-visualização do e-mail"
            srcDoc={previewHtml}
          />
        </section>
      </div>
    </main>
  );
}
