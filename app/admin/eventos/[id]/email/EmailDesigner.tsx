"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import type { EventItem } from "@/lib/event-platform-store";
import { buildVisualEmailHtml, replaceEmailVariables } from "@/lib/email-template-builder";

type Props = { event: EventItem };

type PdfJs = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

async function pdfFirstPageToPng(file: File): Promise<File> {
  const pdfjs: PdfJs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
    import.meta.url
  ).toString();

  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfDocument = await pdfjs.getDocument({ data: bytes }).promise;
  const page = await pdfDocument.getPage(1);
  const viewport = page.getViewport({ scale: 1.8 });
  const canvas = window.document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível preparar o PDF.");

  await page.render({ canvas, canvasContext: context, viewport }).promise;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("Falha ao converter PDF."))), "image/png", 0.94);
  });

  return new File([blob], `${file.name.replace(/\.pdf$/i, "")}.png`, {
    type: "image/png",
  });
}

export default function EmailDesigner({ event }: Props) {
  const [assetUrl, setAssetUrl] = useState(event.banner ?? "");
  const [localPreview, setLocalPreview] = useState("");
  const [subject, setSubject] = useState(event.emailSubject || `Convite: ${event.name}`);
  const [heading, setHeading] = useState(event.name);
  const [preheader, setPreheader] = useState(`Convite especial para ${event.name}`);
  const [body, setBody] = useState(event.emailBody || "Você está convidado para participar deste evento. Escolha uma data e confirme sua participação.");
  const [ctaLabel, setCtaLabel] = useState("Confirmar participação");
  const [altText, setAltText] = useState(`Convite visual do evento ${event.name}`);
  const [primaryColor, setPrimaryColor] = useState(event.primaryColor || "#173b57");
  const [backgroundColor, setBackgroundColor] = useState("#f3f6f9");
  const [footer, setFooter] = useState("Gestão de eventos");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const visualUrl = assetUrl || localPreview;

  const html = useMemo(
    () =>
      buildVisualEmailHtml({
        assetUrl: visualUrl || "https://placehold.co/640x700/png?text=Envie+seu+PDF+ou+imagem",
        altText,
        preheader,
        heading,
        body,
        ctaLabel,
        primaryColor,
        backgroundColor,
        footer,
      }),
    [visualUrl, altText, preheader, heading, body, ctaLabel, primaryColor, backgroundColor, footer]
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

  async function onFile(eventInput: ChangeEvent<HTMLInputElement>) {
    const selected = eventInput.target.files?.[0];
    if (!selected) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const imageFile = selected.type === "application/pdf" ? await pdfFirstPageToPng(selected) : selected;
      if (!imageFile.type.startsWith("image/")) throw new Error("Envie PDF, PNG, JPG ou WEBP.");

      if (localPreview) URL.revokeObjectURL(localPreview);
      setLocalPreview(URL.createObjectURL(imageFile));

      const form = new FormData();
      form.append("file", imageFile);
      const response = await fetch("/api/email-assets/upload", { method: "POST", body: form });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Falha no upload.");

      setAssetUrl(result.url);
      setMessage("Arte enviada. Revise a prévia e salve o template.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao processar arquivo.");
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
      const response = await fetch(`/api/eventos/${encodeURIComponent(event.id)}/email-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
          footer,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Falha ao salvar template.");
      setMessage("Template HTML salvo no evento com sucesso.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao salvar template.");
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
          <p>Envie um PDF ou imagem. O PDF será convertido para uma arte compatível com e-mail.</p>
        </div>
        <button onClick={saveTemplate} disabled={busy || !assetUrl}>
          {busy ? "Processando..." : "Salvar template"}
        </button>
      </header>

      <div className="email-designer-grid">
        <section className="email-designer-controls">
          <article className="designer-card">
            <h2>1. Arte de referência</h2>
            <label className="upload-box">
              <strong>{busy ? "Processando arquivo..." : "Selecionar PDF ou imagem"}</strong>
              <span>PDF, PNG, JPG ou WEBP. A primeira página do PDF será usada.</span>
              <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={onFile} disabled={busy} />
            </label>
            {visualUrl && <img className="asset-miniature" src={visualUrl} alt="Prévia da arte" />}
          </article>

          <article className="designer-card form-fields">
            <h2>2. Conteúdo acessível</h2>
            <label>Assunto<input value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
            <label>Preheader<input value={preheader} onChange={(e) => setPreheader(e.target.value)} /></label>
            <label>Título<input value={heading} onChange={(e) => setHeading(e.target.value)} /></label>
            <label>Texto<textarea rows={7} value={body} onChange={(e) => setBody(e.target.value)} /></label>
            <label>Texto do botão<input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} /></label>
            <label>Descrição da arte<input value={altText} onChange={(e) => setAltText(e.target.value)} /></label>
            <div className="color-row">
              <label>Cor do botão<input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} /></label>
              <label>Fundo<input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} /></label>
            </div>
            <label>Rodapé<input value={footer} onChange={(e) => setFooter(e.target.value)} /></label>
            <p className="variables">Variáveis aplicadas no envio: <code>{"{{nome}}"}</code>, <code>{"{{empresa}}"}</code>, <code>{"{{evento}}"}</code> e <code>{"{{link}}"}</code>.</p>
          </article>

          {message && <div className="designer-message success-message">{message}</div>}
          {error && <div className="designer-message error-message">{error}</div>}
        </section>

        <section className="email-preview-panel">
          <div className="preview-toolbar"><strong>Pré-visualização</strong><span>640 px</span></div>
          <iframe title="Pré-visualização do e-mail" srcDoc={previewHtml} />
        </section>
      </div>
    </main>
  );
}