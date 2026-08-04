import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { isAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo não informado." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Envie uma imagem PNG, JPG ou WEBP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "A imagem deve ter no máximo 8 MB." },
        { status: 400 }
      );
    }

    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const pathname = `eventhub/email-designs/${crypto.randomUUID()}.${extension}`;

    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("[EMAIL ASSET UPLOAD]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao enviar imagem." },
      { status: 500 }
    );
  }
}
