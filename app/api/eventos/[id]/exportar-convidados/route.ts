import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { isAdmin } from "@/lib/admin-auth";
import { getEvent } from "@/lib/event-platform-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function safeFilename(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "evento";
}

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Não autorizado." },
      { status: 401 }
    );
  }

  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    return NextResponse.json(
      { error: "Evento não encontrado." },
      { status: 404 }
    );
  }

  const rows = event.guests.map((guest) => ({
    Nome: guest.name,
    Empresa: guest.company || "",
    Email: guest.email,
    Telefone: guest.phone || "",
    Status:
      guest.status === "confirmed"
        ? "Confirmado"
        : guest.status === "declined"
          ? "Não participará"
          : "Pendente",
    Participantes: guest.participants || 1,
    "Data escolhida": guest.selectedDate || "",
    Observação: guest.notes || "",
    "Convite enviado em": guest.sentAt
      ? new Date(guest.sentAt).toLocaleString("pt-BR")
      : "",
    "Respondido em": guest.respondedAt
      ? new Date(guest.respondedAt).toLocaleString("pt-BR")
      : "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 28 },
    { wch: 24 },
    { wch: 32 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 28 },
    { wch: 42 },
    { wch: 22 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Convidados");

  const summary = XLSX.utils.aoa_to_sheet([
    ["Evento", event.name],
    ["Total de convites", event.guests.length],
    [
      "Confirmados",
      event.guests.filter((guest) => guest.status === "confirmed").length,
    ],
    [
      "Participantes confirmados",
      event.guests
        .filter((guest) => guest.status === "confirmed")
        .reduce((total, guest) => total + (guest.participants || 1), 0),
    ],
    [
      "Pendentes",
      event.guests.filter((guest) => guest.status === "pending").length,
    ],
    [
      "Não participarão",
      event.guests.filter((guest) => guest.status === "declined").length,
    ],
    ["Exportado em", new Date().toLocaleString("pt-BR")],
  ]);
  summary["!cols"] = [{ wch: 30 }, { wch: 34 }];
  XLSX.utils.book_append_sheet(workbook, summary, "Resumo");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="convidados-${safeFilename(
        event.name
      )}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
