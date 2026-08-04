import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import { getEvent } from "@/lib/event-platform-store";
import { listSystemEmailTemplates } from "@/lib/email-template-store";

import "./select-template.css";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SelectEventTemplatePage({
  params,
}: PageProps) {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  const templates = (await listSystemEmailTemplates()).filter(
    (template) => template.active
  );

  return (
    <main className="select-template-page">
      <header>
        <div>
          <small>EVENTO / COMUNICAÇÃO</small>
          <h1>Selecionar template</h1>
          <p>{event.name}</p>
        </div>

        <Link href="/admin/templates">
          Gerenciar templates do sistema
        </Link>
      </header>

      <section className="select-template-grid">
        {templates.map((template) => (
          <form
            action={`/api/eventos/${event.id}/aplicar-email-template`}
            method="post"
            key={template.id}
            className="select-template-card"
          >
            <input type="hidden" name="templateId" value={template.id} />

            <span>{template.type}</span>
            <h2>{template.name}</h2>
            <p>{template.description}</p>
            <strong>{template.subject}</strong>

            <button type="submit">
              Aplicar ao evento
            </button>
          </form>
        ))}

        {!templates.length && (
          <div className="select-template-empty">
            Nenhum template ativo foi encontrado.
          </div>
        )}
      </section>
    </main>
  );
}
