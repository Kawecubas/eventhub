import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import { listSystemEmailTemplates } from "@/lib/email-template-store";
import { publicLocaleLabels } from "@/lib/public-i18n";

import "./templates.css";

export const dynamic = "force-dynamic";

const labels: Record<string, string> = {
  invitation: "Convite",
  reminder: "Lembrete",
  confirmation: "Confirmação",
  declined: "Recusa",
  "thank-you": "Agradecimento",
  custom: "Personalizado",
};

export default async function TemplatesPage() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  const templates = await listSystemEmailTemplates();

  return (
    <main className="templates-page">
      <header className="templates-header">
        <div>
          <small>COMUNICAÇÃO</small>
          <h1>Templates de e-mail</h1>
          <p>
            Crie modelos reutilizáveis para convites, lembretes,
            confirmações e demais comunicações do sistema.
          </p>
        </div>

        <Link href="/admin/templates/novo" className="template-primary">
          + Novo template
        </Link>
      </header>

      <section className="template-grid">
        {templates.map((template) => (
          <article className="template-card" key={template.id}>
            <div className="template-card-top">
              <span>{labels[template.type] || template.type}</span>
              <span>{publicLocaleLabels[template.locale]}</span>
              <b className={template.active ? "active" : "inactive"}>
                {template.active ? "Ativo" : "Inativo"}
              </b>
            </div>

            <h2>{template.name}</h2>
            <p>{template.description || "Sem descrição."}</p>

            <div className="template-subject">
              <small>Assunto</small>
              <strong>{template.subject}</strong>
            </div>

            <Link href={`/admin/templates/${template.id}`}>
              Editar template →
            </Link>
          </article>
        ))}

        {!templates.length && (
          <div className="template-empty">
            <h2>Nenhum template criado</h2>
            <p>Crie o primeiro modelo de comunicação do EventHub.</p>
          </div>
        )}
      </section>
    </main>
  );
}
