import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { exportBackup, importBackup } from "@/lib/event-platform-store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const backup = await exportBackup();
  const stamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="eventhub-backup-${stamp}.txt"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as {
      backup?: unknown;
      mode?: "merge" | "replace";
    };
    const result = await importBackup(body.backup, body.mode || "merge");
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao importar backup" },
      { status: 400 }
    );
  }
}
