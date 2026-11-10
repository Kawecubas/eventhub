import type { EventGuest, EventItem } from "./event-platform-store";

export const GAMBINI_OPENHOUSE_EVENT_ID = "513f724e-69d9-4a53-8402-dc3763e7d7b9";
export const MAX_CONFIRMATION_ROWS = 1000;

export type ConfirmationRow = {
  row: number;
  email: string;
  phone: string;
  slot: string;
};

export type ConfirmationResult = ConfirmationRow & {
  guestName?: string;
  error?: string;
};

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return /^55\d{10,11}$/.test(digits) ? digits.slice(2) : digits;
}

export function splitConfirmationSlot(value: string) {
  const match = value.trim().match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})(?:\s*[-–—|]\s*|\s+)(.+)$/);
  if (!match) return null;
  const [, day, month, year, time] = match;
  return { date: `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`, time: time.trim() };
}

function normalizeSlot(value: string) {
  const parts = splitConfirmationSlot(value);
  const label = parts ? `${parts.date} ${parts.time}` : value.trim();
  return label.replace(/\s*[–—-]\s*/g, "-").replace(/\s+/g, " ").toLowerCase();
}

export function validateConfirmations(event: EventItem, rows: ConfirmationRow[]) {
  const candidates = new Map<string, number>();
  const updates: Array<{ guest: EventGuest; slot: string }> = [];
  const occupied = new Map<string, number>();
  for (const guest of event.guests) {
    if (guest.status === "confirmed" && guest.selectedDate) {
      occupied.set(guest.selectedDate, (occupied.get(guest.selectedDate) ?? 0) + (guest.participants || 1));
    }
  }

  const matches = rows.map((row) => {
    const email = row.email.trim().toLowerCase();
    const phone = normalizePhone(row.phone);
    if (!email && !phone) return { error: "Informe o e-mail ou celular." };
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "E-mail inválido." };
    }
    if (row.phone && (!/^[+\d().\s-]+$/.test(row.phone) || !/^\d{10,15}$/.test(phone))) {
      return { error: "Celular inválido. Inclua o DDD." };
    }
    const guests = event.guests.filter((guest) =>
      (email && guest.email.trim().toLowerCase() === email) ||
      (phone && normalizePhone(guest.phone ?? "") === phone)
    );
    if (guests.length !== 1) {
      return { error: guests.length ? "E-mail ou celular corresponde a mais de um convite." : "Convite não encontrado." };
    }
    const [guest] = guests;
    candidates.set(guest.id, (candidates.get(guest.id) ?? 0) + 1);
    return { guest };
  });

  const results = rows.map((row, index): ConfirmationResult => {
    const { guest, error } = matches[index];
    if (!guest) return { ...row, error };
    const result = { ...row, guestName: guest.name };
    if ((candidates.get(guest.id) ?? 0) > 1) {
      return { ...result, error: "O mesmo convite aparece mais de uma vez no arquivo." };
    }
    const slots = event.dates.filter((date) => normalizeSlot(date.label) === normalizeSlot(row.slot));
    if (!row.slot || slots.length !== 1) {
      return { ...result, error: "Informe uma data e horário que identifiquem uma única opção do evento." };
    }
    const [slot] = slots;
    if (guest.status === "confirmed" && guest.selectedDate === slot.label) {
      return { ...result, error: "Convite já confirmado nesse horário." };
    }
    if (guest.status !== "pending" || guest.respondedAt || guest.checkedIn) {
      return { ...result, error: "Convite já respondido ou com check-in registrado." };
    }
    const total = (occupied.get(slot.label) ?? 0) + (guest.participants || 1);
    if (typeof slot.capacity === "number" && total > slot.capacity) {
      return { ...result, error: "Sem vagas suficientes nesse horário." };
    }
    occupied.set(slot.label, total);
    updates.push({ guest, slot: slot.label });
    return { ...result, slot: slot.label };
  });
  return { results, updates };
}
