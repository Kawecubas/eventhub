"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import QRCode from "qrcode";

import type {
  EventFormField,
  EventGuest,
  EventItem,
} from "@/lib/event-platform-store";
import {
  getEventUiCopy,
  publicLocaleLabels,
  publicLocales,
  resolvePublicLocale,
  type PublicLocale,
} from "@/lib/public-i18n";

type EventResponseProps = {
  event: EventItem;
  guest: EventGuest | null;
  error?: string | null;
};

type ReceiptData = {
  status: "confirmed" | "declined";
  selectedDate?: string;
  notes?: string;
  participants?: number;
  formAnswers?: Record<string, string | boolean | number>;
  respondedAt: string;
};

function splitEventDateLabel(label: string) {
  const normalized = String(label).replace(/\s+/g, " ").trim();
  const match = normalized.match(
    /^(\d{1,2}[\\/.-]\d{1,2}[\\/.-]\d{4})\s*(?:[-–—|:]\s*)?(.+)$/
  );

  if (!match) {
    return null;
  }

  return {
    date: match[1],
    time: match[2].trim() || "Horário não informado",
  };
}

function formatDateTime(value: string | undefined, locale: PublicLocale, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function parseEventDate(dateLabel?: string, startInfo?: string) {
  if (!dateLabel) return null;

  const dateMatch = dateLabel.match(
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/
  );
  if (!dateMatch) return null;

  const [, day, month, year] = dateMatch;
  const combinedText = `${dateLabel} ${startInfo ?? ""}`;
  const timeMatch = combinedText.match(
    /(?:às?|\s)(\d{1,2})(?::|h)(\d{2})?/i
  );

  const hour = timeMatch ? Number(timeMatch[1]) : 9;
  const minute = timeMatch?.[2] ? Number(timeMatch[2]) : 0;

  const start = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    hour,
    minute
  );

  if (Number.isNaN(start.getTime())) return null;

  return {
    start,
    end: new Date(start.getTime() + 2 * 60 * 60 * 1000),
  };
}

function toGoogleDate(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function calendarLinks(event: EventItem, selectedDate?: string) {
  const parsed = parseEventDate(selectedDate, event.startInfo);
  if (!parsed) return null;

  const description = [
    event.description,
    `Data selecionada: ${selectedDate}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const google = new URL(
    "https://calendar.google.com/calendar/render"
  );
  google.searchParams.set("action", "TEMPLATE");
  google.searchParams.set("text", event.name);
  google.searchParams.set(
    "dates",
    `${toGoogleDate(parsed.start)}/${toGoogleDate(parsed.end)}`
  );
  google.searchParams.set("details", description);
  google.searchParams.set("location", event.location || "");

  const outlook = new URL(
    "https://outlook.live.com/calendar/0/deeplink/compose"
  );
  outlook.searchParams.set("path", "/calendar/action/compose");
  outlook.searchParams.set("rru", "addevent");
  outlook.searchParams.set("subject", event.name);
  outlook.searchParams.set("startdt", parsed.start.toISOString());
  outlook.searchParams.set("enddt", parsed.end.toISOString());
  outlook.searchParams.set("body", description);
  outlook.searchParams.set("location", event.location || "");

  return {
    google: google.toString(),
    outlook: outlook.toString(),
  };
}

export default function EventResponse({
  event,
  guest,
  error,
}: EventResponseProps) {
  const [locale, setLocale] = useState<PublicLocale>(() => {
    return resolvePublicLocale(guest?.locale || event.defaultLocale);
  });
  const t = getEventUiCopy(locale);
  const languagePicker = <label style={{ display: "block", textAlign: "right", marginBottom: 16 }}>{t.language}<select value={locale} onChange={(change) => setLocale(change.target.value as PublicLocale)} style={{ marginLeft: 8 }}>{publicLocales.map((item) => <option key={item} value={item}>{publicLocaleLabels[item]}</option>)}</select></label>;
  if (error || !guest) {
    return (
      <section className="event-message">
        {languagePicker}<h2>{error || t.invitationMissing}</h2><p>{t.invitationHint}</p>
      </section>
    );
  }

  if (guest.respondedAt) {
    return (
      <>{languagePicker}<ConfirmationReceipt
        event={event}
        guest={guest}
        response={{
          status:
            guest.status === "declined"
              ? "declined"
              : "confirmed",
          selectedDate: guest.selectedDate,
          notes: guest.notes,
          participants: guest.participants || 1,
          formAnswers: guest.formAnswers || {},
          respondedAt: guest.respondedAt,
        }}
        locale={locale}
        t={t}
      /></>
    );
  }

  return <>{languagePicker}<ResponseForm event={event} guest={guest} locale={locale} t={t} /></>;
}

function ConfirmationReceipt({
  event,
  guest,
  response,
  locale,
  t,
}: {
  event: EventItem;
  guest: EventGuest;
  response: ReceiptData;
  locale: PublicLocale;
  t: ReturnType<typeof getEventUiCopy>;
}) {
  const [qrCode, setQrCode] = useState("");
  const confirmed = response.status === "confirmed";

  const links = useMemo(
    () =>
      confirmed
        ? calendarLinks(event, response.selectedDate)
        : null,
    [confirmed, event, response.selectedDate]
  );

  useEffect(() => {
    QRCode.toDataURL(guest.checkinToken || window.location.href, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then(setQrCode)
      .catch(() => setQrCode(""));
  }, []);

  const customAnswers = (event.formFields || []).filter(
    (field) =>
      field.visible !== false &&
      ["short_text", "long_text", "select", "checkbox"].includes(
        field.type
      ) &&
      response.formAnswers?.[field.id] !== undefined
  );

  return (
    <section className="confirmation-receipt">
      <div className="receipt-print-actions no-print">
        <button type="button" onClick={() => window.print()}>
          {t.print}
        </button>
      </div>

      {event.banner && (
        <div className="receipt-banner">
          <img
            src={event.banner}
            alt={`Imagem do evento ${event.name}`}
          />
        </div>
      )}

      <div className="receipt-header">
        {event.logo && (
          <img
            className="receipt-logo"
            src={event.logo}
            alt={event.name}
          />
        )}

        <div
          className={`receipt-status ${
            confirmed ? "confirmed" : "declined"
          }`}
        >
          <span>{confirmed ? "✓" : "—"}</span>
          <div>
            <small>{t.receipt}</small>
            <h2>
              {confirmed
                ? t.confirmed
                : t.declined}
            </h2>
          </div>
        </div>
      </div>

      <p className="receipt-intro">
        {t.greeting}, <strong>{guest.name}</strong>. {t.responseSaved} <strong>{event.name}</strong>.
      </p>

      <div className="receipt-content">
        <div className="receipt-details">
          <div>
            <span>{t.event}</span>
            <strong>{event.name}</strong>
          </div>

          <div>
            <span>{t.guest}</span>
            <strong>{guest.name}</strong>
          </div>

          {guest.company && (
            <div>
              <span>{t.company}</span>
              <strong>{guest.company}</strong>
            </div>
          )}

          {confirmed && response.selectedDate && (
            <div>
              <span>{t.selectedDate}</span>
              <strong>{response.selectedDate}</strong>
            </div>
          )}

          {confirmed && (
            <div>
              <span>{t.participants}</span>
              <strong>{response.participants || 1}</strong>
            </div>
          )}

          {event.location && (
            <div>
              <span>{t.location}</span>
              <strong>{event.location}</strong>
            </div>
          )}

          <div>
            <span>{t.answeredAt}</span>
            <strong>{formatDateTime(response.respondedAt, locale, t.notProvided)}</strong>
          </div>

          {response.notes && (
            <div className="receipt-notes">
              <span>{t.notes}</span>
              <strong>{response.notes}</strong>
            </div>
          )}

          {customAnswers.map((field) => (
            <div className="receipt-notes" key={field.id}>
              <span>{field.label}</span>
              <strong>
                {response.formAnswers?.[field.id] === true
                  ? t.yes
                  : String(response.formAnswers?.[field.id] ?? "")}
              </strong>
            </div>
          ))}
        </div>

        <aside className="receipt-qr">
          {qrCode ? (
            <img src={qrCode} alt={t.checkinQr} />
          ) : (
            <div className="qr-placeholder">
              {t.generatingQr}
            </div>
          )}
          <strong>{guest.checkinToken ? t.checkinQr : t.invitationQr}</strong>
          <span>{t.qrHint}</span>
        </aside>
      </div>

      {confirmed && (
        <div className="calendar-actions">
          <div>
            <strong>{t.calendar}</strong><span>{t.calendarHint}</span>
          </div>

          {links ? (
            <div className="calendar-buttons">
              <a
                href={links.google}
                target="_blank"
                rel="noreferrer"
              >
                {t.google}
              </a>
              <a
                href={links.outlook}
                target="_blank"
                rel="noreferrer"
              >
                Outlook
              </a>
            </div>
          ) : (
            <span className="calendar-warning">
              {t.dateFormat}
            </span>
          )}
        </div>
      )}

      <p className="response-note">
        {t.changeHint}
      </p>
    </section>
  );
}

function ResponseForm({
  event,
  guest,
  locale,
  t,
}: {
  event: EventItem;
  guest: EventGuest;
  locale: PublicLocale;
  t: ReturnType<typeof getEventUiCopy>;
}) {
  const [status, setStatus] = useState<
    "confirmed" | "declined"
  >(
    guest.status === "declined" ? "declined" : "confirmed"
  );
  const [selectedDate, setSelectedDate] = useState(
    guest.selectedDate || ""
  );
  const [notes, setNotes] = useState(guest.notes || "");
  const [participants, setParticipants] = useState(
    guest.participants || 1
  );
  const [answers, setAnswers] = useState<
    Record<string, string | boolean | number>
  >(guest.formAnswers || {});
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] =
    useState<ReceiptData | null>(null);
  const [submitError, setSubmitError] = useState("");

  const fields = (event.formFields || []).filter(
    (field) => field.visible !== false
  );

  const groupedEventDates = useMemo(() => {
    const groups = new Map<
      string,
      Array<{ id: string; label: string; time: string }>
    >();

    for (const eventDate of event.dates) {
      const parsed = splitEventDateLabel(eventDate.label);
      if (!parsed) continue;

      const current = groups.get(parsed.date) || [];
      current.push({
        id: eventDate.id,
        label: eventDate.label,
        time: parsed.time,
      });
      groups.set(parsed.date, current);
    }

    return Array.from(groups.entries()).map(([date, options]) => ({
      date,
      options,
    }));
  }, [event.dates]);

  const shouldGroupEventDates =
    event.dates.length > 0 &&
    groupedEventDates.reduce(
      (total, group) => total + group.options.length,
      0
    ) === event.dates.length;

  function answer(fieldId: string, value: string | boolean | number) {
    setAnswers((current) => ({
      ...current,
      [fieldId]: value,
    }));
  }

  function validateFields() {
    if (status !== "confirmed") return "";

    for (const field of fields) {
      if (!field.required) continue;

      if (field.type === "event_dates" && !selectedDate) {
        return t.requiredField.replace("{field}", field.label);
      }

      if (field.type === "participants" && participants < 1) {
        return t.requiredField.replace("{field}", field.label);
      }

      if (field.type === "notes" && !notes.trim()) {
        return t.requiredField.replace("{field}", field.label);
      }

      if (
        ["short_text", "long_text", "select"].includes(field.type) &&
        !String(answers[field.id] ?? "").trim()
      ) {
        return t.requiredField.replace("{field}", field.label);
      }

      if (
        field.type === "checkbox" &&
        answers[field.id] !== true
      ) {
        return t.requiredCheck.replace("{field}", field.label);
      }
    }

    return "";
  }

  async function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();

    const validationError = validateFields();

    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setLoading(true);
    setSubmitError("");

    try {
      const response = await fetch(
        `/api/eventos/${encodeURIComponent(
          event.slug
        )}/responder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: guest.token,
            status,
            selectedDate:
              status === "confirmed" ? selectedDate : "",
            notes,
            participants:
              status === "confirmed" ? participants : 1,
            locale,
            formAnswers: answers,
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setSubmitError(
          result?.error ||
            t.submitError
        );
        return;
      }

      setReceipt({
        status,
        selectedDate:
          status === "confirmed" ? selectedDate : undefined,
        notes,
        participants:
          status === "confirmed" ? participants : 1,
        formAnswers: answers,
        respondedAt: new Date().toISOString(),
      });
    } catch {
      setSubmitError(t.networkError);
    } finally {
      setLoading(false);
    }
  }

  function renderField(field: EventFormField) {
    if (field.type === "content") {
      return (
        <section className="dynamic-content-field" key={field.id}>
          <h3>{field.label}</h3>
          {field.description && <p>{field.description}</p>}
        </section>
      );
    }

    if (status !== "confirmed") return null;

    if (field.type === "event_dates") {
      return (
        <fieldset key={field.id}>
          <legend>
            {field.label}
            {field.required ? " *" : ""}
          </legend>
          {field.description && (
            <p className="field-description">
              {field.description}
            </p>
          )}
          {shouldGroupEventDates ? (
            <div className="date-groups">
              {groupedEventDates.map((group) => (
                <section className="date-group" key={group.date}>
                  <h4 className="date-group-title">{group.date}</h4>
                  <div className="date-options">
                    {group.options.map((eventDate) => (
                      <label
                        key={eventDate.id}
                        className={
                          selectedDate === eventDate.label
                            ? "date on"
                            : "date"
                        }
                      >
                        <input
                          type="radio"
                          name={`date-${field.id}`}
                          checked={selectedDate === eventDate.label}
                          onChange={() =>
                            setSelectedDate(eventDate.label)
                          }
                        />
                        <span>{eventDate.time}</span>
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            event.dates.map((eventDate) => (
              <label
                key={eventDate.id}
                className={
                  selectedDate === eventDate.label ? "date on" : "date"
                }
              >
                <input
                  type="radio"
                  name={`date-${field.id}`}
                  checked={selectedDate === eventDate.label}
                  onChange={() => setSelectedDate(eventDate.label)}
                />
                {eventDate.label}
              </label>
            ))
          )}
        </fieldset>
      );
    }

    if (field.type === "participants") {
      const maximum = field.maxParticipants || 10;

      return (
        <div className="participant-quantity" key={field.id}>
          <span>
            {field.label}
            {field.required ? " *" : ""}
          </span>
          {field.description && (
            <p className="field-description">
              {field.description}
            </p>
          )}
          <div className="quantity-control">
            <button
              type="button"
              onClick={() =>
                setParticipants((current) =>
                  Math.max(1, current - 1)
                )
              }
              disabled={participants <= 1}
            >
              −
            </button>
            <strong>{participants}</strong>
            <button
              type="button"
              onClick={() =>
                setParticipants((current) =>
                  Math.min(maximum, current + 1)
                )
              }
              disabled={participants >= maximum}
            >
              +
            </button>
          </div>
          <small>{t.maxPeople.replace("{count}", String(maximum))}</small>
        </div>
      );
    }

    if (field.type === "notes") {
      return (
        <label key={field.id}>
          {field.label}
          {field.required ? " *" : ""}
          {field.description && (
            <span className="field-description">
              {field.description}
            </span>
          )}
          <textarea
            value={notes}
            placeholder={field.placeholder}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
      );
    }

    if (field.type === "short_text") {
      return (
        <label key={field.id}>
          {field.label}
          {field.required ? " *" : ""}
          {field.description && (
            <span className="field-description">
              {field.description}
            </span>
          )}
          <input
            value={String(answers[field.id] ?? "")}
            placeholder={field.placeholder}
            onChange={(event) =>
              answer(field.id, event.target.value)
            }
          />
        </label>
      );
    }

    if (field.type === "long_text") {
      return (
        <label key={field.id}>
          {field.label}
          {field.required ? " *" : ""}
          {field.description && (
            <span className="field-description">
              {field.description}
            </span>
          )}
          <textarea
            value={String(answers[field.id] ?? "")}
            placeholder={field.placeholder}
            onChange={(event) =>
              answer(field.id, event.target.value)
            }
          />
        </label>
      );
    }

    if (field.type === "select") {
      return (
        <label key={field.id}>
          {field.label}
          {field.required ? " *" : ""}
          {field.description && (
            <span className="field-description">
              {field.description}
            </span>
          )}
          <select
            value={String(answers[field.id] ?? "")}
            onChange={(event) =>
              answer(field.id, event.target.value)
            }
          >
            <option value="">
              {field.placeholder || t.select}
            </option>
            {(field.options || []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      );
    }

    return (
      <label className="dynamic-checkbox" key={field.id}>
        <input
          type="checkbox"
          checked={answers[field.id] === true}
          onChange={(event) =>
            answer(field.id, event.target.checked)
          }
        />
        <span>
          <strong>
            {field.label}
            {field.required ? " *" : ""}
          </strong>
          {field.description && <small>{field.description}</small>}
        </span>
      </label>
    );
  }

  if (receipt) {
    return (
      <ConfirmationReceipt
        event={event}
        guest={guest}
        response={receipt}
        locale={locale}
        t={t}
      />
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="identity">
        <label>
          {t.attendee}
          <input readOnly value={guest.name} />
        </label>
        <label>
          {t.company}
          <input readOnly value={guest.company || ""} />
        </label>
      </div>

      <div className="choice">
        <button
          type="button"
          className={status === "confirmed" ? "on" : ""}
          onClick={() => setStatus("confirmed")}
        >
          {t.attend}
        </button>
        <button
          type="button"
          className={status === "declined" ? "on" : ""}
          onClick={() => {
            setStatus("declined");
            setSelectedDate("");
          }}
        >
          {t.cannotAttend}
        </button>
      </div>

      <div className="dynamic-form-fields">
        {fields.map(renderField)}
      </div>

      {submitError && (
        <div className="error" role="alert">
          {submitError}
        </div>
      )}

      <button
        className="submit"
        type="submit"
        disabled={loading}
      >
        {loading ? t.sending : t.submit}
      </button>
    </form>
  );
}
