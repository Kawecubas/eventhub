import { getCompanySettings } from "@/lib/company-settings";
import LoginForm from "./LoginForm";
import "./style.css";

export const dynamic = "force-dynamic";

export default async function LoginPage(){
  return <LoginForm settings={await getCompanySettings()}/>;
}
