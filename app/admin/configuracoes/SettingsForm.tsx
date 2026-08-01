"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import type { CompanySettings } from "@/lib/company-settings";

export default function SettingsForm({ initial }: { initial: CompanySettings }) {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function set<K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/configuracoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      setMessage(result?.error || "Não foi possível salvar.");
      return;
    }

    setForm(result);
    setMessage("Configurações salvas. Atualize a página para aplicar em todo o painel.");
  }

  const previewStyle = {
    "--preview-primary": form.primaryColor,
    "--preview-secondary": form.secondaryColor,
  } as CSSProperties;

  return (
    <form className="settings-form" onSubmit={submit}>
      <section className="settings-section">
        <div className="settings-section-title"><span>01</span><div><h2>Dados da empresa</h2><p>Informações da empresa contratante deste ambiente.</p></div></div>
        <div className="settings-grid">
          <label>Nome fantasia<input value={form.tradeName} onChange={(e)=>set("tradeName",e.target.value)} required/></label>
          <label>Razão social<input value={form.legalName} onChange={(e)=>set("legalName",e.target.value)}/></label>
          <label>CNPJ / documento<input value={form.document} onChange={(e)=>set("document",e.target.value)}/></label>
          <label>E-mail<input type="email" value={form.email} onChange={(e)=>set("email",e.target.value)}/></label>
          <label>Telefone<input value={form.phone} onChange={(e)=>set("phone",e.target.value)}/></label>
          <label>Site<input value={form.website} onChange={(e)=>set("website",e.target.value)}/></label>
          <label className="full">Endereço<input value={form.address} onChange={(e)=>set("address",e.target.value)}/></label>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-title"><span>02</span><div><h2>Identidade visual</h2><p>Use URLs públicas para logo, favicon e imagem do login.</p></div></div>
        <div className="settings-grid">
          <label className="full">URL da logo<input value={form.logo} onChange={(e)=>set("logo",e.target.value)}/></label>
          <label className="full">URL da imagem do login<input value={form.loginBanner} onChange={(e)=>set("loginBanner",e.target.value)}/></label>
          <label className="full">URL do favicon<input value={form.favicon} onChange={(e)=>set("favicon",e.target.value)}/></label>
          <label>Cor principal<div className="color-field"><input type="color" value={form.primaryColor} onChange={(e)=>set("primaryColor",e.target.value)}/><input value={form.primaryColor} onChange={(e)=>set("primaryColor",e.target.value)}/></div></label>
          <label>Cor secundária<div className="color-field"><input type="color" value={form.secondaryColor} onChange={(e)=>set("secondaryColor",e.target.value)}/><input value={form.secondaryColor} onChange={(e)=>set("secondaryColor",e.target.value)}/></div></label>
        </div>
        <div className="branding-preview" style={previewStyle}>
          <div>{form.logo?<img src={form.logo} alt="Prévia da logo"/>:<b>{form.tradeName.slice(0,2).toUpperCase()}</b>}</div>
          <span><strong>{form.tradeName}</strong><small>Pré-visualização do painel</small></span>
          <button type="button">Ação</button>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-title"><span>03</span><div><h2>Tela de login</h2><p>Personalize o texto exibido antes do acesso administrativo.</p></div></div>
        <div className="settings-grid">
          <label className="full">Título<input value={form.loginTitle} onChange={(e)=>set("loginTitle",e.target.value)}/></label>
          <label className="full">Descrição<textarea value={form.loginDescription} onChange={(e)=>set("loginDescription",e.target.value)}/></label>
          <label className="full">Rodapé<input value={form.footerText} onChange={(e)=>set("footerText",e.target.value)}/></label>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-title"><span>04</span><div><h2>E-mail</h2><p>Esses campos servem como padrão para novos eventos.</p></div></div>
        <div className="settings-grid">
          <label className="full">Remetente<input value={form.emailFrom} onChange={(e)=>set("emailFrom",e.target.value)} placeholder="Eventos <eventos@empresa.com.br>"/></label>
          <label className="full">Responder para<input value={form.emailReplyTo} onChange={(e)=>set("emailReplyTo",e.target.value)}/></label>
        </div>
      </section>

      {message&&<div className={message.startsWith("Configurações")?"settings-message ok":"settings-message"}>{message}</div>}
      <div className="settings-actions"><button disabled={loading}>{loading?"Salvando...":"Salvar configurações"}</button></div>
    </form>
  );
}
