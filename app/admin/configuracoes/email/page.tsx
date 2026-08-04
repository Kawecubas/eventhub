import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import {
  getCompanySettings,
  publicCompanySettings,
} from "@/lib/company-settings";
import EmailSettingsPanel from "./EmailSettingsPanel";
import "./style.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EmailSettingsPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const settings = publicCompanySettings(await getCompanySettings());
  return <EmailSettingsPanel initial={settings} />;
}
