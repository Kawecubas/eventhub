"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { EventFormField, EventItem } from "@/lib/event-platform-store";
import { getPublicMessages, publicLocales, type PublicLocale } from "@/lib/public-i18n";

function initialLocale(): PublicLocale {
  if (typeof navigator === "undefined") return "pt-BR";
  const language = navigator.language.toLowerCase();
  return language.startsWith("pt") ? "pt-BR" : language.startsWith("es") ? "es" : language.startsWith("it") ? "it" : "en";
}

export default function PublicRegistration({ event }: { event: EventItem }) {
  const [locale, setLocale] = useState<PublicLocale>(initialLocale);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [company, setCompany] = useState(""); const [phone, setPhone] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); const [participants, setParticipants] = useState(1); const [notes, setNotes] = useState("");
  const [answers, setAnswers] = useState<Record<string, string | boolean | number>>({}); const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [done, setDone] = useState(false);
  const t = getPublicMessages(locale);
  const fields = useMemo(() => (event.formFields || []).filter((field) => field.visible !== false), [event.formFields]);
  const participantField = fields.find((field) => field.type === "participants");
  const maxParticipants = participantField?.maxParticipants || 10;
  const updateAnswer = (id: string, value: string | boolean | number) => setAnswers((current) => ({ ...current, [id]: value }));
  const fallbackHeroStyle = {
    background: `linear-gradient(135deg, ${event.primaryColor || "#173b57"}, ${event.secondaryColor || "#d5a44c"})`,
  };

  function validate() {
    if (!name.trim() || !email.trim()) return t.required;
    if (!/^\S+@\S+\.\S+$/.test(email)) return t.invalidEmail;
    for (const field of fields) {
      if (!field.required) continue;
      if (field.type === "event_dates" && !selectedDate) return t.required;
      if (field.type === "notes" && !notes.trim()) return t.required;
      if (["short_text", "long_text", "select"].includes(field.type) && !String(answers[field.id] || "").trim()) return t.required;
      if (field.type === "checkbox" && answers[field.id] !== true) return t.required;
    }
    return "";
  }
  async function submit(e: FormEvent) {
    e.preventDefault(); const validation = validate(); if (validation) { setError(validation); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/eventos/${encodeURIComponent(event.slug)}/inscrever`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, company, phone, selectedDate, participants, notes, formAnswers: answers, locale }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || t.genericError);
      setDone(true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : t.genericError); } finally { setLoading(false); }
  }
  function renderField(field: EventFormField) {
    if (field.type === "content") return <section className="dynamic-content-field" key={field.id}><h3>{field.label}</h3>{field.description && <p>{field.description}</p>}</section>;
    if (field.type === "event_dates") return <label key={field.id}>{field.label || t.date}{field.required ? " *" : ""}<select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}><option value="">{t.select}</option>{event.dates.map((date) => <option key={date.id} value={date.label}>{date.label}</option>)}</select></label>;
    if (field.type === "participants") return <label key={field.id}>{field.label || t.participants}{field.required ? " *" : ""}<input type="number" min="1" max={maxParticipants} value={participants} onChange={(e) => setParticipants(Math.min(maxParticipants, Math.max(1, Number(e.target.value) || 1)))} /><small>{t.maxPeople.replace("{count}", String(maxParticipants))}</small></label>;
    if (field.type === "notes") return <label key={field.id}>{field.label || t.notes}{field.required ? " *" : ""}<textarea value={notes} placeholder={field.placeholder} onChange={(e) => setNotes(e.target.value)} /></label>;
    if (field.type === "checkbox") return <label className="dynamic-checkbox" key={field.id}><input type="checkbox" checked={answers[field.id] === true} onChange={(e) => updateAnswer(field.id, e.target.checked)} /><span><strong>{field.label}{field.required ? " *" : ""}</strong>{field.description && <small>{field.description}</small>}</span></label>;
    if (field.type === "select") return <label key={field.id}>{field.label}{field.required ? " *" : ""}<select value={String(answers[field.id] || "")} onChange={(e) => updateAnswer(field.id, e.target.value)}><option value="">{field.placeholder || t.select}</option>{(field.options || []).map((option) => <option key={option}>{option}</option>)}</select></label>;
    const long = field.type === "long_text";
    return <label key={field.id}>{field.label}{field.required ? " *" : ""}{long ? <textarea value={String(answers[field.id] || "")} placeholder={field.placeholder} onChange={(e) => updateAnswer(field.id, e.target.value)} /> : <input value={String(answers[field.id] || "")} placeholder={field.placeholder} onChange={(e) => updateAnswer(field.id, e.target.value)} />}</label>;
  }
  if (event.status === "closed" || event.publicRegistrationEnabled === false) return <section className="confirmation-section without-banner"><div className="event-card"><section className="event-message"><h2>{event.status === "closed" ? t.closed : t.unavailable}</h2></section></div></section>;
  return (
    <>
      <header className="event-header">
        <div className="event-header-content public-header-content">
          {event.logo ? <img className="event-logo" src={event.logo} alt={event.name} /> : <strong className="event-brand">{event.name}</strong>}
          <label className="public-language-picker">
            {t.language}
            <select value={locale} onChange={(e) => setLocale(e.target.value as PublicLocale)}>
              <option value="pt-BR">PT-BR</option>
              {publicLocales.filter((item) => item !== "pt-BR").map((item) => <option key={item} value={item}>{item.toUpperCase()}</option>)}
            </select>
          </label>
        </div>
      </header>

      {event.banner ? (
        <section className="event-banner"><img src={event.banner} alt={`Banner do evento ${event.name}`} /></section>
      ) : (
        <section className="event-hero event-hero-without-banner" style={fallbackHeroStyle}>
          <div className="event-hero-content">
            <span className="event-eyebrow">{t.registration.toUpperCase()}</span>
            <h1>{event.name}</h1>
            {event.description && <p className="event-description">{event.description}</p>}
            <div className="event-meta">
              {event.location && <strong>{event.location}</strong>}
              {event.startInfo && <span>{event.startInfo}</span>}
            </div>
          </div>
        </section>
      )}

      <section className={`confirmation-section ${event.banner ? "has-banner" : "without-banner"}`}>
        <header className="confirmation-heading">
          <small>{t.registration.toUpperCase()}</small>
          <h1>{t.register}</h1>
          <p>{t.introduction}</p>
        </header>
        <div className="event-card">
          {done ? (
            <section className="event-message"><h2>{t.successTitle}</h2><p>{t.successText}</p><p>{t.emailNotice}</p></section>
          ) : (
            <form onSubmit={submit}>
              <div className="identity">
                <label>{t.name} *<input value={name} autoComplete="name" onChange={(e) => setName(e.target.value)} /></label>
                <label>{t.email} *<input type="email" value={email} autoComplete="email" onChange={(e) => setEmail(e.target.value)} /></label>
                <label>{t.company} <small>({t.optional})</small><input value={company} autoComplete="organization" onChange={(e) => setCompany(e.target.value)} /></label>
                <label>{t.phone} <small>({t.optional})</small><input value={phone} autoComplete="tel" onChange={(e) => setPhone(e.target.value)} /></label>
              </div>
              <div className="dynamic-form-fields">{fields.map(renderField)}</div>
              {error && <div className="error" role="alert">{error}</div>}
              <button className="submit" disabled={loading} type="submit">{loading ? t.submitting : t.submit}</button>
            </form>
          )}
        </div>
      </section>

      <footer className="event-footer">Gestão de eventos</footer>
    </>
  );
}
