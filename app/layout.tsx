import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EventHub | Gestão de Eventos",
  description: "Plataforma white label para criação, convites e gestão de eventos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
