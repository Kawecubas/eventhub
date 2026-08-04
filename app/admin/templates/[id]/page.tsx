import { notFound, redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import { getSystemEmailTemplate } from "@/lib/email-template-store";
import TemplateEditor from "../TemplateEditor";
import "../templates.css";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTemplatePage({ params }: PageProps) {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const template = await getSystemEmailTemplate(id);

  if (!template) {
    notFound();
  }

  return <TemplateEditor initial={template} />;
}
