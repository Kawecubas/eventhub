import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { getCompanySettings } from "@/lib/company-settings";
import SettingsForm from "./SettingsForm";
import "./style.css";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const settings = await getCompanySettings();

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div><small>AMBIENTE ÚNICO</small><h1>Configurações da empresa</h1><p>Defina a identidade e os dados da empresa contratante.</p></div>
      </div>
      <SettingsForm initial={settings}/>
    </div>
  );
}
