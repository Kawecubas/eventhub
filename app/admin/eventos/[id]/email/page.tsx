import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { getEvent } from "@/lib/event-platform-store";
import EmailDesigner from "./EmailDesigner";
import "./email-designer.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EmailDesignerPage({ params }: PageProps) {
  if (!(await isAdmin())) redirect("/admin/login");

  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  return <EmailDesigner event={event} />;
}
