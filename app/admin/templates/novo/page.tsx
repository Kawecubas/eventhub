import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import TemplateEditor from "../TemplateEditor";
import "../templates.css";

export const dynamic = "force-dynamic";

export default async function NewTemplatePage() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  return <TemplateEditor />;
}
