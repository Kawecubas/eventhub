import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin-auth";
import { getEvent, saveEvent } from "@/lib/event-platform-store";
import { getSystemEmailTemplate } from "@/lib/email-template-store";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  if (!(await isAdmin())) {
    return NextResponse.redirect(
      new URL("/admin/login", request.url)
    );
  }

  const { id } = await params;
  const formData = await request.formData();
  const templateId = String(formData.get("templateId") || "");

  const event = await getEvent(id);
  const template = await getSystemEmailTemplate(templateId);

  if (!event || !template) {
    return NextResponse.redirect(
      new URL(`/admin/eventos/${id}`, request.url)
    );
  }

  await saveEvent({
    ...event,
    emailSubject: template.subject,
    emailHtml: template.html,
  });

  return NextResponse.redirect(
    new URL(`/admin/eventos/${id}/email`, request.url)
  );
}
