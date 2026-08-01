import { getCompanySettings } from "@/lib/company-settings";
import LoginForm from "./LoginForm";
import "./style.css";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const settings = await getCompanySettings();

  return <LoginForm settings={settings} />;
}