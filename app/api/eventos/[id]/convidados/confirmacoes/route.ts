import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { importGambiniConfirmations } from "@/lib/event-platform-store";
import { MAX_CONFIRMATION_ROWS, type ConfirmationRow } from "@/lib/gambini-confirmations";

function isRow(value: unknown): value is ConfirmationRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<ConfirmationRow>;
  return typeof row.row === "number" && Number.isSafeInteger(row.row) && row.row >= 2 &&
    [row.email, row.phone, row.slot].every((cell) => typeof cell === "string" && cell.length <= 500);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!isAdmin()) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.rows) || !body.rows.length ||
    body.rows.length > MAX_CONFIRMATION_ROWS || !body.rows.every(isRow) ||
    (body.version !== undefined && (typeof body.version !== "string" || !/^\d+$/.test(body.version)))) {
    return NextResponse.json({ error: "Arquivo inválido. Envie até 1.000 linhas com células de até 500 caracteres." }, { status: 400 });
  }
  try {
    const result = await importGambiniConfirmations(params.id, body.rows, body.version);
    if (!result) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
    if ("conflict" in result) {
      return NextResponse.json({ error: "O evento mudou desde a prévia. Gere uma nova prévia." }, { status: 409 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Não foi possível processar as confirmações." }, { status: 500 });
  }
}
