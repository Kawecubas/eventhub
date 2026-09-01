import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin-auth";
import { checkinGuestByToken } from "@/lib/event-platform-store";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { id } = await params;
    const { checkinToken } = await request.json();

    const result = await checkinGuestByToken(id, checkinToken);

    if (!result) {
      return NextResponse.json(
        { error: "QR Code inválido ou convidado não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      alreadyCheckedIn: result.alreadyCheckedIn,
      guest: {
        name: result.guest.name,
        company: result.guest.company,
        participants: result.guest.participants,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao processar check-in.",
      },
      { status: 500 }
    );
  }
}
