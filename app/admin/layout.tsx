import type { ReactNode } from "react";
import { getCompanySettings } from "@/lib/company-settings";
import AdminShell from "./components/AdminShell";
import "./admin-shell.css";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const settings = await getCompanySettings();
  return <AdminShell settings={settings}>{children}</AdminShell>;
}
