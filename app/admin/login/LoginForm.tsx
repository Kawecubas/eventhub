"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { CompanySettings } from "@/lib/company-settings";

export default function LoginForm({ settings }: { settings: CompanySettings }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const style = {"--login-primary":settings.primaryColor,"--login-secondary":settings.secondaryColor} as CSSProperties;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();setError("");setLoading(true);
    const response=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})});
    setLoading(false);
    if(!response.ok){setError("Senha inválida.");return;}
    router.push("/admin/dashboard");router.refresh();
  }
console.log("loginBanner:", settings.loginBanner);
  return <main className="white-login" style={style}>
    <section className="white-login-visual" style={settings.loginBanner?{backgroundImage:`linear-gradient(rgba(11,29,43,.55),rgba(11,29,43,.78)),url("${settings.loginBanner}")`}:undefined}>
      <div><span>GESTÃO DE EVENTOS</span><h1>{settings.tradeName}</h1><p>Crie experiências, acompanhe confirmações e organize seus eventos em um único ambiente.</p></div>
    </section>
    <section className="white-login-panel"><div className="white-login-card">
      {settings.logo?<img src={settings.logo} alt={settings.tradeName}/>:<div className="white-login-mark">{settings.tradeName.slice(0,2).toUpperCase()}</div>}
      <small>ACESSO ADMINISTRATIVO</small><h2>{settings.loginTitle}</h2><p>{settings.loginDescription}</p>
      <form onSubmit={submit}><label>Senha<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="current-password" required autoFocus/></label>{error&&<div className="login-error">{error}</div>}<button disabled={loading}>{loading?"Entrando...":"Entrar"}</button></form>
      <footer>{settings.footerText}</footer>
    </div></section>
  </main>;
}
