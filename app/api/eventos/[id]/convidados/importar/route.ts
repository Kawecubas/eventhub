import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import {
  importGuests,
  type GuestImportInput,
} from "@/lib/event-platform-store";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isAdmin()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as {
      rows?: GuestImportInput[];
      duplicateMode?: "skip" | "update";
    };
    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma linha válida enviada" },
        { status: 400 }
      );
    }
    const result = await importGuests(
      params.id,
      body.rows,
      body.duplicateMode || "skip"
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao importar convidados",
      },
      { status: 400 }
    );
  }
}
