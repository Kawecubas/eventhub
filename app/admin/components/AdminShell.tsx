"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type CSSProperties, type ReactNode } from "react";
import type { CompanySettings } from "@/lib/company-settings";

const NAVIGATION = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/admin/eventos", label: "Eventos", icon: "◫" },
  { href: "/admin/configuracoes", label: "Configurações", icon: "⚙" },
];

export default function AdminShell({
  children,
  settings,
}: {
  children: ReactNode;
  settings: CompanySettings;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const style = {
    "--admin-primary": settings.primaryColor,
    "--admin-secondary": settings.secondaryColor,
  } as CSSProperties;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const segments = pathname
    .split("/")
    .filter(Boolean)
    .slice(1);

  return (
    <div className="admin-shell" style={style}>
      <aside className={`admin-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="admin-brand">
          {settings.logo ? (
            <img src={settings.logo} alt={settings.tradeName} />
          ) : (
            <span>{settings.tradeName.slice(0, 2).toUpperCase()}</span>
          )}
          <div>
            <strong>{settings.tradeName}</strong>
            <small>Gestão de eventos</small>
          </div>
        </div>

        <nav>
          {NAVIGATION.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "active" : ""}
                onClick={() => setMobileOpen(false)}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <small>{settings.footerText}</small>
        </div>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="admin-overlay"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="admin-workspace">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            ☰
          </button>

          <div className="admin-breadcrumbs">
            <Link href="/admin/dashboard">Início</Link>
            {segments.map((segment, index) => (
              <span key={`${segment}-${index}`}>
                <b>/</b>
                {decodeURIComponent(segment).replaceAll("-", " ")}
              </span>
            ))}
          </div>

          <div className="admin-topbar-actions">
            <div className="admin-company-mini">
              <strong>{settings.tradeName}</strong>
              <small>Administrador</small>
            </div>
            <button type="button" onClick={logout}>
              Sair
            </button>
          </div>
        </header>

        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
